"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function getUserId() {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");

  let user = await db.user.findUnique({ where: { clerkId } });
  if (!user) {
    user = await db.user.create({
      data: { clerkId, email: "" },
    });
  }
  return user.id;
}

export async function createCheckout(data: {
  projectId: string;
  items: {
    productId: string;
    assetId?: string;
    quantity: number;
  }[];
  notes?: string;
}) {
  const userId = await getUserId();

  await db.$transaction(async (tx) => {
    const transfer = await tx.transfer.create({
      data: {
        userId,
        projectId: data.projectId,
        type: "checkout",
        notes: data.notes || null,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            assetId: item.assetId || null,
            quantity: item.quantity,
          })),
        },
      },
    });

    for (const item of data.items) {
      if (item.assetId) {
        // Serialized: assign asset to project
        await tx.asset.update({
          where: { id: item.assetId },
          data: { currentProjectId: data.projectId },
        });
      } else {
        // Bulk: deduct quantity
        await tx.product.update({
          where: { id: item.productId },
          data: { quantity: { decrement: item.quantity } },
        });
      }
    }

    return transfer;
  });

  revalidatePath(`/projects/${data.projectId}`);
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
}

export async function createCheckin(data: {
  projectId: string;
  items: {
    productId: string;
    assetId?: string;
    quantity: number;
    condition?: string;
  }[];
  notes?: string;
}) {
  const userId = await getUserId();

  await db.$transaction(async (tx) => {
    await tx.transfer.create({
      data: {
        userId,
        projectId: data.projectId,
        type: "checkin",
        notes: data.notes || null,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            assetId: item.assetId || null,
            quantity: item.quantity,
            condition: item.condition || null,
          })),
        },
      },
    });

    for (const item of data.items) {
      if (item.assetId) {
        // Serialized: clear project assignment, update condition
        await tx.asset.update({
          where: { id: item.assetId },
          data: {
            currentProjectId: null,
            ...(item.condition ? { condition: item.condition } : {}),
          },
        });
      } else {
        // Bulk: add quantity back
        await tx.product.update({
          where: { id: item.productId },
          data: { quantity: { increment: item.quantity } },
        });
      }
    }
  });

  revalidatePath(`/projects/${data.projectId}`);
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
}

export async function getTransfers(projectId?: string) {
  const userId = await getUserId();

  return db.transfer.findMany({
    where: {
      userId,
      ...(projectId ? { projectId } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      project: { select: { id: true, name: true } },
      items: {
        include: {
          product: { select: { id: true, name: true, trackingType: true } },
          asset: { select: { id: true, barcode: true, serialNumber: true } },
        },
      },
    },
  });
}

export async function getProjectReport(projectId: string) {
  const userId = await getUserId();

  const project = await db.project.findFirst({
    where: { id: projectId, userId },
  });
  if (!project) throw new Error("Project not found");

  const transfers = await db.transfer.findMany({
    where: { projectId, userId },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, trackingType: true } },
          asset: {
            select: {
              id: true,
              barcode: true,
              serialNumber: true,
              condition: true,
              currentProjectId: true,
            },
          },
        },
      },
    },
  });

  // Build summary per product
  const productSummary: Record<
    string,
    {
      productId: string;
      productName: string;
      trackingType: string;
      checkedOut: number;
      checkedIn: number;
      assets: {
        id: string;
        barcode: string;
        serialNumber: string | null;
        condition: string;
        stillOut: boolean;
      }[];
    }
  > = {};

  for (const transfer of transfers) {
    for (const item of transfer.items) {
      if (!productSummary[item.productId]) {
        productSummary[item.productId] = {
          productId: item.productId,
          productName: item.product.name,
          trackingType: item.product.trackingType,
          checkedOut: 0,
          checkedIn: 0,
          assets: [],
        };
      }
      const summary = productSummary[item.productId];
      if (transfer.type === "checkout") {
        summary.checkedOut += item.quantity;
      } else {
        summary.checkedIn += item.quantity;
      }
      if (item.asset) {
        const existing = summary.assets.find((a) => a.id === item.asset!.id);
        if (!existing) {
          summary.assets.push({
            id: item.asset.id,
            barcode: item.asset.barcode,
            serialNumber: item.asset.serialNumber,
            condition: item.asset.condition,
            stillOut: item.asset.currentProjectId === projectId,
          });
        } else {
          existing.stillOut = item.asset.currentProjectId === projectId;
          existing.condition = item.asset.condition;
        }
      }
    }
  }

  return {
    project,
    transfers,
    summary: Object.values(productSummary),
  };
}

export async function getProjectCheckedOutItems(projectId: string) {
  const userId = await getUserId();

  // Get bulk items checked out (from transfers)
  const checkouts = await db.transfer.findMany({
    where: { projectId, userId, type: "checkout" },
    include: {
      items: {
        where: { assetId: null },
        include: { product: true },
      },
    },
  });

  const checkins = await db.transfer.findMany({
    where: { projectId, userId, type: "checkin" },
    include: {
      items: {
        where: { assetId: null },
        include: { product: true },
      },
    },
  });

  // Calculate net bulk quantities per product
  const bulkItems: Record<
    string,
    { productId: string; productName: string; quantity: number; trackingType: string }
  > = {};

  for (const transfer of checkouts) {
    for (const item of transfer.items) {
      if (!bulkItems[item.productId]) {
        bulkItems[item.productId] = {
          productId: item.productId,
          productName: item.product.name,
          quantity: 0,
          trackingType: item.product.trackingType,
        };
      }
      bulkItems[item.productId].quantity += item.quantity;
    }
  }

  for (const transfer of checkins) {
    for (const item of transfer.items) {
      if (bulkItems[item.productId]) {
        bulkItems[item.productId].quantity -= item.quantity;
      }
    }
  }

  // Get serialized assets at this project
  const assets = await db.asset.findMany({
    where: { currentProjectId: projectId, userId },
    include: {
      product: { select: { id: true, name: true, trackingType: true } },
    },
  });

  return {
    bulkItems: Object.values(bulkItems).filter((i) => i.quantity > 0),
    assets,
  };
}

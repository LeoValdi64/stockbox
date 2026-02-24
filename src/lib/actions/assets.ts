"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { generateBarcode } from "@/lib/utils";

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

export async function getAssets(productId: string) {
  const userId = await getUserId();

  return db.asset.findMany({
    where: { productId, userId },
    orderBy: { createdAt: "desc" },
    include: {
      project: { select: { id: true, name: true } },
    },
  });
}

export async function getAssetByBarcode(barcode: string) {
  const userId = await getUserId();

  return db.asset.findFirst({
    where: { userId, barcode },
    include: {
      product: true,
      project: { select: { id: true, name: true } },
    },
  });
}

export async function createAsset(data: {
  productId: string;
  serialNumber?: string;
  notes?: string;
}) {
  const userId = await getUserId();

  // Generate a unique barcode
  let barcode: string;
  let attempts = 0;
  do {
    barcode = generateBarcode();
    const existing = await db.asset.findUnique({
      where: { userId_barcode: { userId, barcode } },
    });
    if (!existing) break;
    attempts++;
  } while (attempts < 10);

  if (attempts >= 10) {
    throw new Error("Failed to generate unique barcode");
  }

  const asset = await db.asset.create({
    data: {
      userId,
      productId: data.productId,
      barcode,
      serialNumber: data.serialNumber || null,
      notes: data.notes || null,
    },
  });

  revalidatePath(`/inventory/${data.productId}/assets`);
  revalidatePath(`/inventory/${data.productId}`);
  return asset;
}

export async function updateAsset(
  id: string,
  data: {
    serialNumber?: string;
    condition?: string;
    notes?: string;
    currentProjectId?: string | null;
  }
) {
  const userId = await getUserId();

  const asset = await db.asset.findFirst({ where: { id, userId } });
  if (!asset) throw new Error("Asset not found");

  const updated = await db.asset.update({
    where: { id },
    data: {
      ...(data.serialNumber !== undefined
        ? { serialNumber: data.serialNumber || null }
        : {}),
      ...(data.condition !== undefined ? { condition: data.condition } : {}),
      ...(data.notes !== undefined ? { notes: data.notes || null } : {}),
      ...(data.currentProjectId !== undefined
        ? { currentProjectId: data.currentProjectId }
        : {}),
    },
  });

  revalidatePath(`/inventory/${asset.productId}/assets`);
  return updated;
}

export async function deleteAsset(id: string) {
  const userId = await getUserId();

  const asset = await db.asset.findFirst({ where: { id, userId } });
  if (!asset) throw new Error("Asset not found");

  await db.asset.delete({ where: { id } });

  revalidatePath(`/inventory/${asset.productId}/assets`);
  revalidatePath(`/inventory/${asset.productId}`);
}

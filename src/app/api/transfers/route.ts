import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

async function getUserId() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  let user = await db.user.findUnique({ where: { clerkId } });
  if (!user) {
    user = await db.user.create({
      data: { clerkId, email: "" },
    });
  }
  return user.id;
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    const transfers = await db.transfer.findMany({
      where: {
        userId,
        ...(projectId ? { projectId } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        project: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
    });

    return NextResponse.json(transfers);
  } catch (error) {
    console.error("Transfer GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch transfers" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { projectId, type, notes, items } = body as {
      projectId: string;
      type: "checkout" | "checkin";
      notes?: string;
      items: { productId: string; assetId?: string; quantity: number; condition?: string }[];
    };

    if (!projectId || !type || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: projectId, type, items" },
        { status: 400 }
      );
    }

    if (type !== "checkout" && type !== "checkin") {
      return NextResponse.json(
        { error: "Type must be 'checkout' or 'checkin'" },
        { status: 400 }
      );
    }

    // Verify project belongs to user
    const project = await db.project.findFirst({
      where: { id: projectId, userId },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Validate all items exist and belong to user
    for (const item of items) {
      const product = await db.product.findFirst({
        where: { id: item.productId, userId },
      });
      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.productId}` },
          { status: 400 }
        );
      }

      if (item.assetId) {
        const asset = await db.asset.findFirst({
          where: { id: item.assetId, userId },
        });
        if (!asset) {
          return NextResponse.json(
            { error: `Asset not found: ${item.assetId}` },
            { status: 400 }
          );
        }

        if (type === "checkout" && asset.currentProjectId) {
          return NextResponse.json(
            { error: `Asset ${asset.barcode} is already checked out` },
            { status: 400 }
          );
        }

        if (type === "checkin" && asset.currentProjectId !== projectId) {
          return NextResponse.json(
            { error: `Asset ${asset.barcode} is not at this project` },
            { status: 400 }
          );
        }
      } else if (type === "checkout") {
        if (product.quantity < item.quantity) {
          return NextResponse.json(
            { error: `Insufficient stock for ${product.name}: have ${product.quantity}, need ${item.quantity}` },
            { status: 400 }
          );
        }
      }
    }

    // Create transfer with items in a transaction
    const transfer = await db.$transaction(async (tx) => {
      const transfer = await tx.transfer.create({
        data: {
          userId,
          projectId,
          type,
          notes: notes || null,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              assetId: item.assetId || null,
              quantity: item.quantity,
              condition: item.condition || null,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: { select: { id: true, name: true } },
              asset: { select: { id: true, barcode: true, serialNumber: true } },
            },
          },
          project: { select: { id: true, name: true } },
        },
      });

      // Update inventory
      for (const item of items) {
        if (item.assetId) {
          if (type === "checkout") {
            await tx.asset.update({
              where: { id: item.assetId },
              data: { currentProjectId: projectId },
            });
          } else {
            await tx.asset.update({
              where: { id: item.assetId },
              data: {
                currentProjectId: null,
                ...(item.condition ? { condition: item.condition } : {}),
              },
            });
          }
        } else {
          if (type === "checkout") {
            await tx.product.update({
              where: { id: item.productId },
              data: { quantity: { decrement: item.quantity } },
            });
          } else {
            await tx.product.update({
              where: { id: item.productId },
              data: { quantity: { increment: item.quantity } },
            });
          }
        }
      }

      return transfer;
    });

    return NextResponse.json(transfer, { status: 201 });
  } catch (error) {
    console.error("Transfer POST error:", error);
    return NextResponse.json(
      { error: "Failed to create transfer" },
      { status: 500 }
    );
  }
}

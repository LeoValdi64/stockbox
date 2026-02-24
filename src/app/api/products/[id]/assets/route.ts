import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { generateBarcode } from "@/lib/utils";

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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: productId } = await params;

    const assets = await db.asset.findMany({
      where: { productId, userId },
      orderBy: { createdAt: "desc" },
      include: {
        project: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(assets);
  } catch (error) {
    console.error("Assets GET error:", error);
    return NextResponse.json({ error: "Failed to fetch assets" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: productId } = await params;
    const body = await req.json();
    const { serialNumber, notes } = body;

    // Verify product exists and belongs to user
    const product = await db.product.findFirst({ where: { id: productId, userId } });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

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
      return NextResponse.json({ error: "Failed to generate unique barcode" }, { status: 500 });
    }

    const asset = await db.asset.create({
      data: {
        userId,
        productId,
        barcode,
        serialNumber: serialNumber || null,
        notes: notes || null,
      },
    });

    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    console.error("Asset POST error:", error);
    return NextResponse.json({ error: "Failed to create asset" }, { status: 500 });
  }
}

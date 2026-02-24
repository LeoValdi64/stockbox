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
    const barcode = searchParams.get("barcode");

    if (!barcode) {
      return NextResponse.json(
        { error: "Missing barcode parameter" },
        { status: 400 }
      );
    }

    // Try asset barcode first (serialized items)
    const asset = await db.asset.findFirst({
      where: { userId, barcode },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            trackingType: true,
            imageUrl: true,
            quantity: true,
          },
        },
        project: { select: { id: true, name: true } },
      },
    });

    if (asset) {
      return NextResponse.json({
        type: "asset",
        asset,
        product: asset.product,
      });
    }

    // Try product barcode (bulk items)
    const product = await db.product.findFirst({
      where: { userId, barcode },
      select: {
        id: true,
        name: true,
        trackingType: true,
        imageUrl: true,
        quantity: true,
        barcode: true,
      },
    });

    if (product) {
      return NextResponse.json({
        type: "product",
        product,
      });
    }

    return NextResponse.json(
      { error: "No product or asset found for this barcode" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Product lookup error:", error);
    return NextResponse.json(
      { error: "Failed to lookup barcode" },
      { status: 500 }
    );
  }
}

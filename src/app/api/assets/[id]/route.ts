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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { serialNumber, condition, notes, currentProjectId } = body;

    const existing = await db.asset.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    const asset = await db.asset.update({
      where: { id },
      data: {
        ...(serialNumber !== undefined ? { serialNumber: serialNumber || null } : {}),
        ...(condition !== undefined ? { condition } : {}),
        ...(notes !== undefined ? { notes: notes || null } : {}),
        ...(currentProjectId !== undefined ? { currentProjectId } : {}),
      },
    });

    return NextResponse.json(asset);
  } catch (error) {
    console.error("Asset PATCH error:", error);
    return NextResponse.json({ error: "Failed to update asset" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await db.asset.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    await db.asset.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Asset DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete asset" }, { status: 500 });
  }
}

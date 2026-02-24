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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const project = await db.project.findFirst({
      where: { id, userId },
      include: {
        assets: {
          include: { product: true },
        },
        transfers: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            items: {
              include: {
                product: true,
                asset: true,
              },
            },
          },
        },
        _count: {
          select: { assets: true, transfers: true },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Project GET error:", error);
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
  }
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
    const { name, location, status, notes } = body;

    const existing = await db.project.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const project = await db.project.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(location !== undefined ? { location: location || null } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(notes !== undefined ? { notes: notes || null } : {}),
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("Project PATCH error:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
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

    const deleted = await db.project.deleteMany({
      where: { id, userId },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Project DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}

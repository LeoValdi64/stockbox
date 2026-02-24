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
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const transfers = await db.transfer.findMany({
      where: { projectId: id, userId },
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
              stillOut: item.asset.currentProjectId === id,
            });
          } else {
            existing.stillOut = item.asset.currentProjectId === id;
            existing.condition = item.asset.condition;
          }
        }
      }
    }

    const summary = Object.values(productSummary);
    const totalOut = summary.reduce((sum, s) => sum + s.checkedOut, 0);
    const totalIn = summary.reduce((sum, s) => sum + s.checkedIn, 0);
    const discrepancies = summary.filter((s) => s.checkedOut > s.checkedIn).length;

    return NextResponse.json({
      project,
      transfers,
      summary,
      totals: { totalOut, totalIn, discrepancies },
    });
  } catch (error) {
    console.error("Project report GET error:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}

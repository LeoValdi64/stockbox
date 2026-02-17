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

export async function getSales() {
  const userId = await getUserId();

  return db.sale.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: { product: true },
      },
    },
  });
}

export async function createSale(data: {
  items: { productId: string; quantity: number; price: number }[];
  notes?: string;
}) {
  const userId = await getUserId();

  const total = data.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const sale = await db.$transaction(async (tx) => {
    const sale = await tx.sale.create({
      data: {
        userId,
        total,
        notes: data.notes || null,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            priceAtSale: item.price,
          })),
        },
      },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    for (const item of data.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          quantity: { decrement: item.quantity },
        },
      });
    }

    return sale;
  });

  revalidatePath("/sales");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  return sale;
}

export async function deleteSale(id: string) {
  const userId = await getUserId();

  await db.$transaction(async (tx) => {
    const sale = await tx.sale.findFirst({
      where: { id, userId },
      include: { items: true },
    });

    if (!sale) throw new Error("Sale not found");

    for (const item of sale.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          quantity: { increment: item.quantity },
        },
      });
    }

    await tx.sale.delete({ where: { id } });
  });

  revalidatePath("/sales");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
}

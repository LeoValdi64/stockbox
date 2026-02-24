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

export async function getProducts(search?: string, category?: string) {
  const userId = await getUserId();

  return db.product.findMany({
    where: {
      userId,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { barcode: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(category ? { category } : {}),
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getProduct(id: string) {
  const userId = await getUserId();
  return db.product.findFirst({
    where: { id, userId },
  });
}

export async function getProductByBarcode(barcode: string) {
  const userId = await getUserId();
  return db.product.findFirst({
    where: { userId, barcode },
  });
}

export async function createProduct(data: {
  name: string;
  description?: string;
  barcode?: string;
  quantity?: number;
  minStock?: number;
  category?: string;
  costPrice?: number;
  salePrice?: number;
  imageUrl?: string;
  trackingType?: string;
}) {
  const userId = await getUserId();

  const product = await db.product.create({
    data: {
      userId,
      name: data.name,
      description: data.description || null,
      barcode: data.barcode || null,
      quantity: data.quantity ?? 0,
      minStock: data.minStock ?? null,
      category: data.category || null,
      costPrice: data.costPrice ?? null,
      salePrice: data.salePrice ?? null,
      imageUrl: data.imageUrl || null,
      trackingType: data.trackingType || "bulk",
    },
  });

  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  return product;
}

export async function updateProduct(
  id: string,
  data: {
    name?: string;
    description?: string;
    barcode?: string;
    quantity?: number;
    minStock?: number;
    category?: string;
    costPrice?: number;
    salePrice?: number;
    imageUrl?: string;
    trackingType?: string;
  }
) {
  const userId = await getUserId();

  const product = await db.product.updateMany({
    where: { id, userId },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.description !== undefined
        ? { description: data.description || null }
        : {}),
      ...(data.barcode !== undefined
        ? { barcode: data.barcode || null }
        : {}),
      ...(data.quantity !== undefined ? { quantity: data.quantity } : {}),
      ...(data.minStock !== undefined
        ? { minStock: data.minStock ?? null }
        : {}),
      ...(data.category !== undefined
        ? { category: data.category || null }
        : {}),
      ...(data.costPrice !== undefined
        ? { costPrice: data.costPrice ?? null }
        : {}),
      ...(data.salePrice !== undefined
        ? { salePrice: data.salePrice ?? null }
        : {}),
      ...(data.imageUrl !== undefined
        ? { imageUrl: data.imageUrl || null }
        : {}),
    },
  });

  revalidatePath("/inventory");
  revalidatePath(`/inventory/${id}`);
  revalidatePath("/dashboard");
  return product;
}

export async function adjustQuantity(id: string, delta: number) {
  const userId = await getUserId();

  const product = await db.product.findFirst({ where: { id, userId } });
  if (!product) throw new Error("Product not found");

  const newQty = Math.max(0, product.quantity + delta);

  await db.product.update({
    where: { id },
    data: { quantity: newQty },
  });

  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  return newQty;
}

export async function deleteProduct(id: string) {
  const userId = await getUserId();

  await db.product.deleteMany({
    where: { id, userId },
  });

  revalidatePath("/inventory");
  revalidatePath("/dashboard");
}

export async function getDashboardStats() {
  const userId = await getUserId();

  const [products, lowStockProducts, recentSales, activeProjects, checkedOutAssets, recentTransfers] = await Promise.all([
    db.product.findMany({ where: { userId } }),
    db.product.findMany({
      where: {
        userId,
        minStock: { not: null },
      },
    }),
    db.sale.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        items: {
          include: { product: true },
        },
      },
    }),
    db.project.count({ where: { userId, status: "active" } }),
    db.asset.count({ where: { userId, currentProjectId: { not: null } } }),
    db.transfer.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        project: { select: { name: true } },
        items: { include: { product: { select: { name: true } } } },
      },
    }),
  ]);

  const totalProducts = products.length;
  const totalItems = products.reduce((sum, p) => sum + p.quantity, 0);
  const totalValue = products.reduce(
    (sum, p) => sum + (p.salePrice ?? 0) * p.quantity,
    0
  );
  const lowStock = lowStockProducts.filter(
    (p) => p.minStock !== null && p.quantity <= p.minStock
  );

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);

  const todayRevenue = recentSales
    .filter((s) => s.createdAt >= todayStart)
    .reduce((sum, s) => sum + s.total, 0);

  const weekRevenue = recentSales
    .filter((s) => s.createdAt >= weekStart)
    .reduce((sum, s) => sum + s.total, 0);

  return {
    totalProducts,
    totalItems,
    totalValue,
    lowStock,
    recentSales,
    todayRevenue,
    weekRevenue,
    activeProjects,
    checkedOutAssets,
    recentTransfers,
  };
}

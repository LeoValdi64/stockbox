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

export async function getCategories() {
  const userId = await getUserId();

  return db.category.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });
}

export async function createCategory(data: {
  name: string;
  color?: string;
  icon?: string;
}) {
  const userId = await getUserId();

  const category = await db.category.create({
    data: {
      userId,
      name: data.name,
      color: data.color || null,
      icon: data.icon || null,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/inventory");
  return category;
}

export async function updateCategory(
  id: string,
  data: { name?: string; color?: string; icon?: string }
) {
  const userId = await getUserId();

  await db.category.updateMany({
    where: { id, userId },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.color !== undefined ? { color: data.color || null } : {}),
      ...(data.icon !== undefined ? { icon: data.icon || null } : {}),
    },
  });

  revalidatePath("/settings");
  revalidatePath("/inventory");
}

export async function deleteCategory(id: string) {
  const userId = await getUserId();

  await db.category.deleteMany({
    where: { id, userId },
  });

  revalidatePath("/settings");
  revalidatePath("/inventory");
}

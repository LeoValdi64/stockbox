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

export async function getProjects(status?: string) {
  const userId = await getUserId();

  return db.project.findMany({
    where: {
      userId,
      ...(status ? { status } : {}),
    },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: {
          assets: true,
          transfers: true,
        },
      },
    },
  });
}

export async function getProject(id: string) {
  const userId = await getUserId();

  return db.project.findFirst({
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
}

export async function createProject(data: {
  name: string;
  location?: string;
  notes?: string;
}) {
  const userId = await getUserId();

  const project = await db.project.create({
    data: {
      userId,
      name: data.name,
      location: data.location || null,
      notes: data.notes || null,
    },
  });

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return project;
}

export async function updateProject(
  id: string,
  data: {
    name?: string;
    location?: string;
    status?: string;
    notes?: string;
  }
) {
  const userId = await getUserId();

  await db.project.updateMany({
    where: { id, userId },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.location !== undefined
        ? { location: data.location || null }
        : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.notes !== undefined ? { notes: data.notes || null } : {}),
    },
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  revalidatePath("/dashboard");
}

export async function deleteProject(id: string) {
  const userId = await getUserId();

  await db.project.deleteMany({
    where: { id, userId },
  });

  revalidatePath("/projects");
  revalidatePath("/dashboard");
}

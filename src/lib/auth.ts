import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "./db";

export async function getOrCreateUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  let user = await db.user.findUnique({
    where: { clerkId },
  });

  if (!user) {
    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    user = await db.user.create({
      data: {
        clerkId,
        email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
        name: clerkUser.firstName
          ? `${clerkUser.firstName} ${clerkUser.lastName ?? ""}`.trim()
          : null,
      },
    });
  }

  return user;
}

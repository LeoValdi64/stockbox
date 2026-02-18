import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { BottomNav } from "@/components/bottom-nav";
import { FAB } from "@/components/fab";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-36">
      <main className="mx-auto max-w-lg px-4 py-6">{children}</main>
      <FAB />
      <BottomNav />
    </div>
  );
}

"use client";

import { useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useState } from "react";

export function SignOutButton() {
  const { signOut } = useClerk();
  const [loading, setLoading] = useState(false);

  return (
    <Button
      variant="destructive"
      className="w-full gap-2"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        await signOut({ redirectUrl: "/" });
      }}
    >
      <LogOut className="h-4 w-4" />
      {loading ? "Signing out..." : "Sign Out"}
    </Button>
  );
}

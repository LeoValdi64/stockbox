"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ScanBarcode,
  FolderKanban,
  MoreHorizontal,
  ShoppingCart,
  ArrowLeftRight,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/inventory/scan", label: "Scan", icon: ScanBarcode, primary: true },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "#more", label: "More", icon: MoreHorizontal, isMore: true },
];

const moreItems = [
  { href: "/sales", label: "Sales", icon: ShoppingCart },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);

  const handleScanClick = () => {
    if (pathname === "/inventory/scan") {
      window.dispatchEvent(new CustomEvent("stockbox:restart-scan"));
    } else {
      router.push("/inventory/scan");
    }
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-lg pb-[env(safe-area-inset-bottom,12px)]">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            if (item.primary) {
              return (
                <button
                  key={item.href}
                  onClick={handleScanClick}
                  className="flex flex-col items-center"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-zinc-950 shadow-lg shadow-white/10 transition-transform active:scale-95">
                    <Icon className="h-5 w-5" />
                  </div>
                </button>
              );
            }

            if (item.isMore) {
              return (
                <Sheet key="more" open={moreOpen} onOpenChange={setMoreOpen}>
                  <SheetTrigger asChild>
                    <button
                      className={cn(
                        "flex flex-col items-center gap-0.5 px-3 py-1 transition-colors",
                        moreOpen ? "text-white" : "text-zinc-500"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-[10px] font-medium">
                        {item.label}
                      </span>
                    </button>
                  </SheetTrigger>
                  <SheetContent
                    side="bottom"
                    className="border-zinc-800 bg-zinc-950 pb-[env(safe-area-inset-bottom,24px)]"
                  >
                    <SheetHeader>
                      <SheetTitle>More</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4 space-y-1">
                      {moreItems.map((moreItem) => {
                        const MoreIcon = moreItem.icon;
                        const isItemActive =
                          pathname === moreItem.href ||
                          pathname.startsWith(moreItem.href + "/");
                        return (
                          <Link
                            key={moreItem.href}
                            href={moreItem.href}
                            onClick={() => setMoreOpen(false)}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-3 transition-colors",
                              isItemActive
                                ? "bg-zinc-800 text-white"
                                : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                            )}
                          >
                            <MoreIcon className="h-5 w-5" />
                            <span className="text-sm font-medium">
                              {moreItem.label}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </SheetContent>
                </Sheet>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1 transition-colors",
                  isActive ? "text-white" : "text-zinc-500"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

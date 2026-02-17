import { UserButton } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Settings, Tag, User } from "lucide-react";
import { getCategories } from "@/lib/actions/categories";
import { CategoriesManager } from "@/components/categories-manager";

export default async function SettingsPage() {
  let categories: Awaited<ReturnType<typeof getCategories>> = [];
  try {
    categories = await getCategories();
  } catch {
    categories = [];
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Profile */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-12 w-12",
                },
              }}
            />
            <div>
              <p className="text-sm text-zinc-400">
                Manage your account, update your profile, or sign out.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Tag className="h-4 w-4" />
            Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CategoriesManager initialCategories={categories} />
        </CardContent>
      </Card>

      {/* App info */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="h-4 w-4" />
            About
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-zinc-400">
            <div className="flex justify-between">
              <span>Version</span>
              <span className="text-zinc-300">1.0.0</span>
            </div>
            <Separator className="bg-zinc-800" />
            <p>
              StockBox is a free, minimal inventory management app with barcode
              scanning and sales tracking.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

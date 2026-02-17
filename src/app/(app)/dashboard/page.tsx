import {
  Package,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  ShoppingCart,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDashboardStats } from "@/lib/actions/inventory";
import Link from "next/link";

export default async function DashboardPage() {
  let stats: Awaited<ReturnType<typeof getDashboardStats>> | null = null;
  try {
    stats = await getDashboardStats();
  } catch {
    stats = null;
  }

  if (!stats) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="pt-6">
            <p className="text-center text-zinc-400">
              Connect your database to see stats here.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-zinc-400">
              <Package className="h-4 w-4" />
              <span className="text-xs">Products</span>
            </div>
            <p className="mt-1 text-2xl font-bold">{stats.totalProducts}</p>
            <p className="text-xs text-zinc-500">{stats.totalItems} total items</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-zinc-400">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs">Inventory Value</span>
            </div>
            <p className="mt-1 text-2xl font-bold">
              ${stats.totalValue.toFixed(2)}
            </p>
            <p className="text-xs text-zinc-500">at sale price</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-zinc-400">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">Today</span>
            </div>
            <p className="mt-1 text-2xl font-bold">
              ${stats.todayRevenue.toFixed(2)}
            </p>
            <p className="text-xs text-zinc-500">
              ${stats.weekRevenue.toFixed(2)} this week
            </p>
          </CardContent>
        </Card>

        <Card
          className={`border-zinc-800 ${
            stats.lowStock.length > 0
              ? "border-red-900/50 bg-red-950/20"
              : "bg-zinc-900"
          }`}
        >
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-zinc-400">
              <AlertTriangle
                className={`h-4 w-4 ${
                  stats.lowStock.length > 0 ? "text-red-400" : ""
                }`}
              />
              <span className="text-xs">Low Stock</span>
            </div>
            <p className="mt-1 text-2xl font-bold">{stats.lowStock.length}</p>
            <p className="text-xs text-zinc-500">items below threshold</p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      {stats.lowStock.length > 0 && (
        <Card className="border-red-900/50 bg-zinc-900">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.lowStock.map((product) => (
              <Link
                key={product.id}
                href={`/inventory/${product.id}`}
                className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-3 py-2 transition-colors hover:bg-zinc-800"
              >
                <span className="text-sm">{product.name}</span>
                <Badge variant="destructive" className="text-xs">
                  {product.quantity} / {product.minStock}
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent Sales */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShoppingCart className="h-4 w-4" />
            Recent Sales
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentSales.length === 0 ? (
            <p className="py-4 text-center text-sm text-zinc-500">
              No sales yet. Create your first sale!
            </p>
          ) : (
            <div className="space-y-2">
              {stats.recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-3 py-2"
                >
                  <div>
                    <p className="text-sm">
                      {sale.items.length} item
                      {sale.items.length !== 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {new Date(sale.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="font-medium">
                    ${sale.total.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

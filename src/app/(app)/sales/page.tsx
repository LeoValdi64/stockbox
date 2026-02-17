import Link from "next/link";
import { Plus, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSales } from "@/lib/actions/sales";
import { DeleteSaleButton } from "@/components/delete-sale-button";

export default async function SalesPage() {
  let sales;
  try {
    sales = await getSales();
  } catch {
    sales = [];
  }

  const totalRevenue = sales.reduce(
    (sum: number, s: { total: number }) => sum + s.total,
    0
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sales</h1>
        <Button size="sm" asChild>
          <Link href="/sales/new">
            <Plus className="mr-1 h-4 w-4" />
            New Sale
          </Link>
        </Button>
      </div>

      {/* Revenue summary */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400">Total Revenue</p>
              <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-400">Total Sales</p>
              <p className="text-2xl font-bold">{sales.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales list */}
      {sales.length === 0 ? (
        <div className="py-12 text-center">
          <ShoppingCart className="mx-auto h-12 w-12 text-zinc-700" />
          <p className="mt-4 text-zinc-500">No sales yet.</p>
          <Button className="mt-4" asChild>
            <Link href="/sales/new">Create First Sale</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {sales.map((sale) => (
            <Card key={sale.id} className="border-zinc-800 bg-zinc-900">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        ${sale.total.toFixed(2)}
                      </span>
                      <Badge variant="secondary" className="text-[10px]">
                        {sale.items.length} item
                        {sale.items.length !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {new Date(sale.createdAt).toLocaleString()}
                    </p>
                    {sale.notes && (
                      <p className="mt-1 text-xs text-zinc-400">
                        {sale.notes}
                      </p>
                    )}
                    <div className="mt-2 space-y-0.5">
                      {sale.items.map(
                        (item: {
                          id: string;
                          quantity: number;
                          priceAtSale: number;
                          product: { name: string };
                        }) => (
                          <p
                            key={item.id}
                            className="text-xs text-zinc-500"
                          >
                            {item.quantity}x {item.product.name} @$
                            {item.priceAtSale.toFixed(2)}
                          </p>
                        )
                      )}
                    </div>
                  </div>
                  <DeleteSaleButton id={sale.id} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

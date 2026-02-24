import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, LogOut, LogIn, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getProjectReport } from "@/lib/actions/transfers";

export default async function ProjectReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let report: Awaited<ReturnType<typeof getProjectReport>> | null = null;

  try {
    report = await getProjectReport(id);
  } catch {
    report = null;
  }

  if (!report) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/projects/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Report</h1>
          <p className="text-sm text-zinc-400">{report.project.name}</p>
        </div>
      </div>

      {/* Summary Table */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Item Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {report.summary.length === 0 ? (
            <p className="py-4 text-center text-sm text-zinc-500">
              No transfer activity.
            </p>
          ) : (
            <div className="space-y-3">
              {report.summary.map((item) => {
                const missing = item.checkedOut - item.checkedIn;
                return (
                  <div
                    key={item.productId}
                    className="rounded-lg bg-zinc-800/50 px-3 py-2"
                  >
                    <p className="text-sm font-medium">{item.productName}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1 text-amber-400">
                        <LogOut className="h-3 w-3" />
                        Out: {item.checkedOut}
                      </span>
                      <span className="flex items-center gap-1 text-emerald-400">
                        <LogIn className="h-3 w-3" />
                        In: {item.checkedIn}
                      </span>
                      {missing > 0 && (
                        <span className="flex items-center gap-1 text-red-400">
                          <AlertTriangle className="h-3 w-3" />
                          Missing: {missing}
                        </span>
                      )}
                      {missing === 0 && item.checkedOut > 0 && (
                        <Badge
                          variant="outline"
                          className="text-[10px] text-emerald-400 border-emerald-500/30"
                        >
                          All returned
                        </Badge>
                      )}
                    </div>
                    {/* Serialized assets */}
                    {item.assets.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {item.assets.map((asset) => (
                          <div
                            key={asset.id}
                            className="flex items-center justify-between rounded bg-zinc-900/50 px-2 py-1"
                          >
                            <span className="font-mono text-[10px] text-zinc-400">
                              {asset.barcode}
                              {asset.serialNumber && ` · ${asset.serialNumber}`}
                            </span>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${
                                  asset.condition === "good"
                                    ? "text-emerald-400"
                                    : asset.condition === "damaged"
                                      ? "text-red-400"
                                      : asset.condition === "lost"
                                        ? "text-zinc-500"
                                        : "text-amber-400"
                                }`}
                              >
                                {asset.condition}
                              </Badge>
                              {asset.stillOut ? (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] text-red-400 border-red-500/30"
                                >
                                  Still out
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] text-emerald-400 border-emerald-500/30"
                                >
                                  Returned
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transfer History */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Transfer History</CardTitle>
        </CardHeader>
        <CardContent>
          {report.transfers.length === 0 ? (
            <p className="py-4 text-center text-sm text-zinc-500">
              No transfers.
            </p>
          ) : (
            <div className="space-y-2">
              {report.transfers.map((transfer) => (
                <div
                  key={transfer.id}
                  className="rounded-lg bg-zinc-800/50 px-3 py-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {transfer.type === "checkout" ? (
                        <LogOut className="h-3.5 w-3.5 text-amber-400" />
                      ) : (
                        <LogIn className="h-3.5 w-3.5 text-emerald-400" />
                      )}
                      <span className="text-sm font-medium capitalize">
                        {transfer.type === "checkout"
                          ? "Check Out"
                          : "Check In"}
                      </span>
                    </div>
                    <span className="text-xs text-zinc-500">
                      {new Date(transfer.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {transfer.items.map((item) => (
                      <Badge
                        key={item.id}
                        variant="secondary"
                        className="text-[10px]"
                      >
                        {item.product.name}
                        {item.quantity > 1 ? ` x${item.quantity}` : ""}
                        {item.asset ? ` (${item.asset.barcode})` : ""}
                      </Badge>
                    ))}
                  </div>
                  {transfer.notes && (
                    <p className="mt-1 text-xs text-zinc-500">
                      {transfer.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

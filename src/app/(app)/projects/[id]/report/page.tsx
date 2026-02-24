import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  LogOut,
  LogIn,
  AlertTriangle,
  CheckCircle2,
  Package,
  Box,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

  const totalOut = report.summary.reduce((sum, s) => sum + s.checkedOut, 0);
  const totalIn = report.summary.reduce((sum, s) => sum + s.checkedIn, 0);
  const discrepancies = report.summary.filter(
    (s) => s.checkedOut > s.checkedIn
  ).length;
  const fullyReturned = report.summary.filter(
    (s) => s.checkedOut > 0 && s.checkedOut === s.checkedIn
  ).length;

  return (
    <div className="space-y-4">
      {/* Header */}
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

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold text-amber-400">{totalOut}</p>
            <p className="text-[10px] text-zinc-500">Total Out</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold text-emerald-400">{totalIn}</p>
            <p className="text-[10px] text-zinc-500">Total Returned</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="py-3 text-center">
            <p
              className={`text-2xl font-bold ${
                discrepancies > 0 ? "text-red-400" : "text-emerald-400"
              }`}
            >
              {discrepancies}
            </p>
            <p className="text-[10px] text-zinc-500">Discrepancies</p>
          </CardContent>
        </Card>
      </div>

      {/* Product Summary Table */}
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
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-xs text-zinc-500">
                    Product
                  </TableHead>
                  <TableHead className="text-right text-xs text-zinc-500">
                    Out
                  </TableHead>
                  <TableHead className="text-right text-xs text-zinc-500">
                    In
                  </TableHead>
                  <TableHead className="text-right text-xs text-zinc-500">
                    Diff
                  </TableHead>
                  <TableHead className="text-right text-xs text-zinc-500">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.summary.map((item) => {
                  const diff = item.checkedOut - item.checkedIn;
                  let statusColor: string;
                  let statusText: string;
                  if (diff === 0 && item.checkedOut > 0) {
                    statusColor = "text-emerald-400";
                    statusText = "Returned";
                  } else if (diff > 0 && item.checkedIn > 0) {
                    statusColor = "text-amber-400";
                    statusText = "Partial";
                  } else if (diff > 0) {
                    statusColor = "text-red-400";
                    statusText = "Out";
                  } else {
                    statusColor = "text-zinc-500";
                    statusText = "—";
                  }

                  return (
                    <TableRow
                      key={item.productId}
                      className="border-zinc-800/50"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {item.trackingType === "serialized" ? (
                            <Box className="h-3.5 w-3.5 text-zinc-500" />
                          ) : (
                            <Package className="h-3.5 w-3.5 text-zinc-500" />
                          )}
                          <span className="text-sm">{item.productName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm text-amber-400">
                        {item.checkedOut}
                      </TableCell>
                      <TableCell className="text-right text-sm text-emerald-400">
                        {item.checkedIn}
                      </TableCell>
                      <TableCell
                        className={`text-right text-sm font-medium ${
                          diff > 0
                            ? "text-red-400"
                            : diff === 0
                              ? "text-emerald-400"
                              : "text-zinc-500"
                        }`}
                      >
                        {diff > 0 ? `-${diff}` : diff === 0 ? "0" : `+${Math.abs(diff)}`}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${statusColor} ${
                            statusColor === "text-emerald-400"
                              ? "border-emerald-500/30"
                              : statusColor === "text-amber-400"
                                ? "border-amber-500/30"
                                : statusColor === "text-red-400"
                                  ? "border-red-500/30"
                                  : "border-zinc-700"
                          }`}
                        >
                          {statusText}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Serialized Assets Still Out */}
      {report.summary.some((s) => s.assets.some((a) => a.stillOut)) && (
        <Card className="border-red-500/20 bg-zinc-900">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-red-400">
              <AlertTriangle className="h-4 w-4" />
              Assets Still at Project
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {report.summary
                .flatMap((s) =>
                  s.assets
                    .filter((a) => a.stillOut)
                    .map((a) => ({ ...a, productName: s.productName }))
                )
                .map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium">{asset.productName}</p>
                      <p className="font-mono text-[10px] text-zinc-500">
                        {asset.barcode}
                        {asset.serialNumber && ` · ${asset.serialNumber}`}
                      </p>
                    </div>
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
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Returned Assets */}
      {report.summary.some((s) => s.assets.some((a) => !a.stillOut)) && (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              Returned Assets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {report.summary
                .flatMap((s) =>
                  s.assets
                    .filter((a) => !a.stillOut)
                    .map((a) => ({ ...a, productName: s.productName }))
                )
                .map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium">{asset.productName}</p>
                      <p className="font-mono text-[10px] text-zinc-500">
                        {asset.barcode}
                        {asset.serialNumber && ` · ${asset.serialNumber}`}
                      </p>
                    </div>
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
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                      <span className="text-sm font-medium">
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
                    <p className="mt-1 text-xs text-zinc-500 italic">
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

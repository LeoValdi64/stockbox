import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  LogOut,
  LogIn,
  FileText,
  MapPin,
  Package,
  Box,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getProject } from "@/lib/actions/projects";
import { getProjectCheckedOutItems } from "@/lib/actions/transfers";
import { DeleteProjectButton } from "@/components/delete-project-button";
import { TransferList } from "@/components/transfer-list";

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  completed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  archived: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let project: Awaited<ReturnType<typeof getProject>> | null = null;
  let checkedOut: Awaited<ReturnType<typeof getProjectCheckedOutItems>> | null =
    null;

  try {
    [project, checkedOut] = await Promise.all([
      getProject(id),
      getProjectCheckedOutItems(id),
    ]);
  } catch {
    project = null;
  }

  if (!project) {
    notFound();
  }

  // Serialize dates for client component
  const serializedTransfers = project.transfers.map((t) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    items: t.items.map((item) => ({
      ...item,
      product: {
        id: item.product.id,
        name: item.product.name,
      },
      asset: item.asset
        ? {
            id: item.asset.id,
            barcode: item.asset.barcode,
            serialNumber: item.asset.serialNumber,
          }
        : null,
    })),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/projects">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            {project.location && (
              <p className="flex items-center gap-1 text-xs text-zinc-400">
                <MapPin className="h-3 w-3" />
                {project.location}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={statusColors[project.status] || ""}
          >
            {project.status}
          </Badge>
          <Button variant="outline" size="icon" asChild>
            <Link href={`/projects/${project.id}/edit`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
          <DeleteProjectButton id={project.id} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant="outline"
          className="flex h-auto flex-col gap-1 py-3"
          asChild
        >
          <Link href={`/projects/${project.id}/checkout`}>
            <LogOut className="h-5 w-5" />
            <span className="text-xs">Check Out</span>
          </Link>
        </Button>
        <Button
          variant="outline"
          className="flex h-auto flex-col gap-1 py-3"
          asChild
        >
          <Link href={`/projects/${project.id}/checkin`}>
            <LogIn className="h-5 w-5" />
            <span className="text-xs">Check In</span>
          </Link>
        </Button>
        <Button
          variant="outline"
          className="flex h-auto flex-col gap-1 py-3"
          asChild
        >
          <Link href={`/projects/${project.id}/report`}>
            <FileText className="h-5 w-5" />
            <span className="text-xs">Report</span>
          </Link>
        </Button>
      </div>

      {/* Items at this project */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Items at Project</CardTitle>
        </CardHeader>
        <CardContent>
          {(!checkedOut ||
            (checkedOut.bulkItems.length === 0 &&
              checkedOut.assets.length === 0)) ? (
            <p className="py-4 text-center text-sm text-zinc-500">
              No items currently checked out to this project.
            </p>
          ) : (
            <div className="space-y-2">
              {checkedOut.bulkItems.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-zinc-400" />
                    <span className="text-sm">{item.productName}</span>
                  </div>
                  <Badge variant="secondary">{item.quantity}</Badge>
                </div>
              ))}
              {checkedOut.assets.map((asset) => (
                <div
                  key={asset.id}
                  className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <Box className="h-4 w-4 text-zinc-400" />
                    <div>
                      <span className="text-sm">{asset.product.name}</span>
                      <p className="font-mono text-[10px] text-zinc-500">
                        {asset.barcode}
                        {asset.serialNumber && ` · ${asset.serialNumber}`}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      asset.condition === "good"
                        ? "text-emerald-400"
                        : asset.condition === "damaged"
                          ? "text-red-400"
                          : "text-amber-400"
                    }
                  >
                    {asset.condition}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transfer History (expandable) */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Transfer History ({project.transfers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TransferList transfers={serializedTransfers} />
        </CardContent>
      </Card>

      {project.notes && (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-400">{project.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import Link from "next/link";
import { Plus, FolderKanban, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getProjects } from "@/lib/actions/projects";

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  completed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  archived: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

export default async function ProjectsPage() {
  let projects: Awaited<ReturnType<typeof getProjects>> = [];
  try {
    projects = await getProjects();
  } catch {
    projects = [];
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Button size="sm" asChild>
          <Link href="/projects/new">
            <Plus className="mr-1 h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="flex flex-col items-center gap-3 py-8">
            <FolderKanban className="h-10 w-10 text-zinc-600" />
            <p className="text-sm text-zinc-400">No projects yet.</p>
            <Button size="sm" asChild>
              <Link href="/projects/new">Create your first project</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="border-zinc-800 bg-zinc-900 transition-colors hover:bg-zinc-900/80">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">{project.name}</p>
                      {project.location && (
                        <p className="flex items-center gap-1 text-xs text-zinc-400">
                          <MapPin className="h-3 w-3" />
                          {project.location}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-zinc-500">
                        <span>{project._count.assets} assets</span>
                        <span>{project._count.transfers} transfers</span>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={statusColors[project.status] || ""}
                    >
                      {project.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

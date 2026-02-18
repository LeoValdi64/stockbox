import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { minioClient, MINIO_BUCKET } from "@/lib/minio";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { filename } = await params;

    await minioClient.removeObject(MINIO_BUCKET, filename);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}

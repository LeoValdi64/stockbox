import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { minioClient, MINIO_BUCKET, MINIO_PUBLIC_URL } from "@/lib/minio";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;

    await minioClient.putObject(MINIO_BUCKET, fileName, buffer, buffer.length, {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=3600",
    });

    const url = `${MINIO_PUBLIC_URL}/${MINIO_BUCKET}/${fileName}`;

    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Upload error:", message, error);
    return NextResponse.json({ error: "Upload failed", detail: message }, { status: 500 });
  }
}

"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
}

const MAX_SIZE = 1024 * 1024; // 1MB

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;

      // Scale down if needed
      const maxDim = 1200;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = (height / width) * maxDim;
          width = maxDim;
        } else {
          width = (width / height) * maxDim;
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      // Start with high quality, reduce until under MAX_SIZE
      let quality = 0.8;
      const tryCompress = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to compress image"));
              return;
            }
            if (blob.size > MAX_SIZE && quality > 0.1) {
              quality -= 0.1;
              tryCompress();
            } else {
              resolve(blob);
            }
          },
          "image/jpeg",
          quality
        );
      };
      tryCompress();
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

export function ImageUpload({ value, onChange }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      setUploading(true);
      try {
        const compressed = await compressImage(file);
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
        const path = `${fileName}`;

        if (!supabase) { toast.error("Storage not configured"); return; }
        const { error } = await supabase.storage
          .from("product-images")
          .upload(path, compressed, {
            contentType: "image/jpeg",
            cacheControl: "3600",
          });

        if (error) throw error;

        const { data: urlData } = supabase!.storage
          .from("product-images")
          .getPublicUrl(path);

        onChange(urlData.publicUrl);
        toast.success("Image uploaded");
      } catch (err) {
        toast.error("Failed to upload image");
        console.error(err);
      } finally {
        setUploading(false);
      }
    },
    [onChange]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  };

  const handleRemove = async () => {
    if (value) {
      // Extract path from URL
      try {
        const url = new URL(value);
        const parts = url.pathname.split("/product-images/");
        if (parts[1]) {
          await supabase?.storage.from("product-images").remove([parts[1]]);
        }
      } catch {
        // Ignore cleanup errors
      }
    }
    onChange(null);
  };

  if (value) {
    return (
      <div className="relative">
        <img
          src={value}
          alt="Product"
          className="h-48 w-full rounded-lg border border-zinc-700 object-cover"
        />
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute right-2 top-2 h-8 w-8"
          onClick={handleRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div
        className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-6 transition-colors ${
          dragOver
            ? "border-white bg-zinc-800"
            : "border-zinc-700 bg-zinc-800/50"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {uploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        ) : (
          <ImageIcon className="h-8 w-8 text-zinc-500" />
        )}
        <p className="text-sm text-zinc-400">
          {uploading ? "Uploading..." : "Drag & drop or"}
        </p>
        {!uploading && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-1 h-3.5 w-3.5" />
              Browse
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => cameraInputRef.current?.click()}
            >
              <Camera className="mr-1 h-3.5 w-3.5" />
              Camera
            </Button>
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

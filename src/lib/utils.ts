import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Characters excluding ambiguous: O, 0, I, 1, L
const BARCODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateBarcode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += BARCODE_CHARS[Math.floor(Math.random() * BARCODE_CHARS.length)];
  }
  return `SB-${code}`;
}

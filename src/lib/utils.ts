import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPKR(amount?: number) {
  if (amount === undefined || amount === null) return "N/A";
  return "Rs. " + Math.round(amount).toLocaleString("en-PK");
}

export function getSupabaseImageUrl(path: string) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  
  // Clean up path if it already has images/phones/ or just phones/
  const cleanPath = path.replace(/^images\//, "").replace(/^phones\//, "");
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/phones/${cleanPath}`;
}

import { NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";
import { PHONES_TAG, phoneTag, invalidatePhonesMemoryCache } from "@/lib/phones";

export const dynamic = "force-dynamic";

export async function GET() {
  invalidatePhonesMemoryCache();
  try {
    revalidateTag(PHONES_TAG, { expire: 0 });
    revalidateTag("new-in-phones", { expire: 0 });
    revalidateTag(phoneTag("apple-iphone-18-pro"), { expire: 0 });
    revalidateTag(phoneTag("apple-iphone-18-pro-max"), { expire: 0 });
    revalidatePath("/", "layout");
    revalidatePath("/new-in", "page");
    revalidatePath("/phone/apple-iphone-18-pro", "page");
    revalidatePath("/phone/apple-iphone-18-pro-max", "page");
  } catch (err) {
    console.error("Revalidation error:", err);
  }
  return NextResponse.json({ revalidated: true, now: Date.now() });
}

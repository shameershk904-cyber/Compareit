import { NextRequest, NextResponse } from "next/server";
import { verifyServerSession } from "@/lib/auth";
import { uploadBannerImage, MAX_BANNER_SIZE_BYTES } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { authenticated, user, error } = await verifyServerSession(["ADMIN", "EDITOR"]);
  if (!authenticated || !user) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    if (file.size > MAX_BANNER_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File size exceeds 2 MB limit (${(file.size / 1024 / 1024).toFixed(2)} MB)` },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadBannerImage(buffer, file.type, file.name);

    if (!result.success || !result.url) {
      return NextResponse.json({ error: result.error || "Upload failed" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      path: result.path,
    });
  } catch (err: any) {
    console.error("Banner image upload route error:", err);
    return NextResponse.json({ error: "An unexpected error occurred during upload" }, { status: 500 });
  }
}

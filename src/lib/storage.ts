import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lazily initialised so that missing env vars don't throw at build/module-eval
// time (which crashes Vercel's static page collection step).
let _supabaseAdmin: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
  if (_supabaseAdmin) return _supabaseAdmin;

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://cevetoazfcbjmodmjzyh.supabase.co";
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";

  if (!serviceRoleKey) {
    throw new Error(
      "Supabase service role key is not configured. " +
        "Set SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) in your environment."
    );
  }

  _supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return _supabaseAdmin;
}

// Proxy so existing call-sites using `supabaseAdmin.storage.*` keep working.
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabaseAdmin() as never)[prop as keyof SupabaseClient];
  },
});

export const BUCKET_BANNERS = "banners";
export const MAX_BANNER_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export interface UploadBannerResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

/**
 * Ensures the public 'banners' storage bucket exists in Supabase.
 */
export async function ensureBannersBucketExists(): Promise<boolean> {
  try {
    const { data: buckets, error } = await supabaseAdmin.storage.listBuckets();
    if (error) {
      console.warn("Could not list Supabase buckets:", error.message);
      return false;
    }

    const exists = buckets?.some((b) => b.name === BUCKET_BANNERS);
    if (!exists) {
      const { error: createError } = await supabaseAdmin.storage.createBucket(BUCKET_BANNERS, {
        public: true,
        fileSizeLimit: MAX_BANNER_SIZE_BYTES,
        allowedMimeTypes: ALLOWED_IMAGE_TYPES,
      });
      if (createError) {
        console.error("Failed to create banners bucket:", createError.message);
        return false;
      }
    }
    return true;
  } catch (err) {
    console.error("ensureBannersBucketExists error:", err);
    return false;
  }
}

/**
 * Validates and uploads a banner image buffer to Supabase Storage.
 */
export async function uploadBannerImage(
  fileBuffer: Buffer | Uint8Array,
  mimeType: string,
  originalFilename = "banner.webp"
): Promise<UploadBannerResult> {
  // 1. Validate MIME type
  if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) {
    return {
      success: false,
      error: `Invalid file type: ${mimeType}. Allowed formats: JPG, PNG, WEBP.`,
    };
  }

  // 2. Validate Size
  if (fileBuffer.byteLength > MAX_BANNER_SIZE_BYTES) {
    return {
      success: false,
      error: `File size exceeds 2 MB limit (${(fileBuffer.byteLength / 1024 / 1024).toFixed(2)} MB).`,
    };
  }

  // 3. Ensure bucket exists
  await ensureBannersBucketExists();

  // 4. Generate unique clean filename
  const ext = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
  const cleanBase = originalFilename
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 30);
  const fileName = `${cleanBase}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

  // 5. Upload via Server Role Key
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_BANNERS)
    .upload(fileName, fileBuffer, {
      contentType: mimeType,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Supabase banner upload error:", error);
    return {
      success: false,
      error: error.message || "Failed to upload banner image to Supabase Storage.",
    };
  }

  // 6. Return public URL
  const { data: publicUrlData } = supabaseAdmin.storage
    .from(BUCKET_BANNERS)
    .getPublicUrl(data.path);

  return {
    success: true,
    url: publicUrlData.publicUrl,
    path: data.path,
  };
}

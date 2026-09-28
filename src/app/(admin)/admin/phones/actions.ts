"use server";

import prisma from "@/lib/prisma";
import { verifyServerSession } from "@/lib/auth";
import { revalidateTag, updateTag, revalidatePath } from "next/cache";
import { PHONES_TAG, phoneTag, invalidatePhonesMemoryCache } from "@/lib/phones";

function purgePhoneCaches(slug?: string) {
  try {
    invalidatePhonesMemoryCache();
    updateTag(PHONES_TAG);
    revalidateTag(PHONES_TAG, { expire: 0 });
    if (slug) {
      updateTag(phoneTag(slug));
      revalidateTag(phoneTag(slug), { expire: 0 });
      revalidatePath(`/phone/${slug}`, "page");
    }
    revalidatePath("/", "layout");
    revalidatePath("/compare", "page");
  } catch (err) {
    console.error("Cache purge error:", err);
  }
}

export interface PhoneFilterParams {
  page?: number;
  pageSize?: number;
  search?: string;
  brand?: string;
  status?: "all" | "active" | "inactive";
}

export interface AdminPhoneFormData {
  id?: string;
  slug: string;
  brand: string;
  model: string;
  pricePkr: number;
  lowestVerifiedPrice?: number;
  usdPrice?: number;
  image?: string;
  images?: string[];
  releaseDate?: string;
  status?: string;
  isActive: boolean;
  popular?: boolean;
  trendingRank?: number;
  ptaStatus?: string;
  ptaTax?: { passport: number; cnic: number } | null;
  warranty?: { duration_months: number; provider: string } | null;
  memory?: Record<string, unknown>;
  battery?: Record<string, unknown>;
  display?: Record<string, unknown>;
  platform?: Record<string, unknown>;
  camera?: Record<string, unknown>;
  connectivity?: Record<string, unknown>;
}

// ─── 1. Fetch Paginated Phones ────────────────────────────────────────────────
export async function fetchAdminPhonesAction(params: PhoneFilterParams) {
  const { authenticated } = await verifyServerSession(["ADMIN", "EDITOR", "VIEWER"]);
  if (!authenticated) {
    return { success: false, error: "Unauthorized access" };
  }

  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(10, params.pageSize || 25));
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};

  if (params.status === "active") {
    where.isActive = true;
  } else if (params.status === "inactive") {
    where.isActive = false;
  }

  if (params.brand && params.brand !== "all") {
    where.brand = { equals: params.brand, mode: "insensitive" };
  }

  if (params.search && params.search.trim()) {
    const q = params.search.trim();
    where.OR = [
      { model: { contains: q, mode: "insensitive" } },
      { brand: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
    ];
  }

  try {
    const [total, phones] = await Promise.all([
      prisma.phone.count({ where }),
      prisma.phone.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ updatedAt: "desc" }],
        select: {
          id: true,
          legacyId: true,
          slug: true,
          brand: true,
          model: true,
          pricePkr: true,
          lowestVerifiedPrice: true,
          usdPrice: true,
          image: true,
          releaseDate: true,
          status: true,
          isActive: true,
          popular: true,
          trendingRank: true,
          ptaStatus: true,
          ptaTax: true,
          warranty: true,
          memory: true,
          battery: true,
          display: true,
          platform: true,
          camera: true,
          connectivity: true,
          images: true,
          updatedAt: true,
        },
      }),
    ]);

    return {
      success: true,
      data: {
        phones: phones.map((p) => ({
          ...p,
          updatedAt: p.updatedAt.toISOString(),
        })),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  } catch (error) {
    console.error("fetchAdminPhonesAction error:", error);
    return { success: false, error: "Failed to load phones catalog" };
  }
}

// ─── 2. Fetch Unique Brands for Dropdown ──────────────────────────────────────
export async function fetchBrandsAction() {
  try {
    const brands = await prisma.phone.findMany({
      select: { brand: true },
      distinct: ["brand"],
      orderBy: { brand: "asc" },
    });
    return {
      success: true,
      brands: brands.map((b) => b.brand).filter(Boolean),
    };
  } catch (error) {
    console.error("fetchBrandsAction error:", error);
    return { success: false, brands: [] };
  }
}

// ─── 3. Toggle Phone Active / Inactive ─────────────────────────────────────────
export async function togglePhoneActiveAction(phoneId: string, isActive: boolean) {
  const { authenticated, user, error } = await verifyServerSession(["ADMIN", "EDITOR"]);
  if (!authenticated || !user) {
    return { success: false, error: error || "Unauthorized permission" };
  }

  try {
    const phone = await prisma.phone.update({
      where: { id: phoneId },
      data: { isActive },
      select: { id: true, slug: true, brand: true, model: true },
    });

    // Invalidate next.js cache tags so public site updates instantly!
    purgePhoneCaches(phone.slug);

    // Audit log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        action: isActive ? "ACTIVATE_PHONE" : "DEACTIVATE_PHONE",
        entity: "PHONE",
        entityId: phone.id,
        details: {
          phone: `${phone.brand} ${phone.model}`,
          slug: phone.slug,
          isActive,
        },
      },
    });

    return { success: true };
  } catch (err) {
    console.error("togglePhoneActiveAction error:", err);
    return { success: false, error: "Failed to update phone status" };
  }
}

// ─── 4. Save Phone (Create or Update) ──────────────────────────────────────────
export async function savePhoneAction(data: AdminPhoneFormData) {
  const { authenticated, user, error } = await verifyServerSession(["ADMIN", "EDITOR"]);
  if (!authenticated || !user) {
    return { success: false, error: error || "Unauthorized permission" };
  }

  // Basic validation
  if (!data.brand?.trim() || !data.model?.trim()) {
    return { success: false, error: "Brand and Model are required" };
  }

  // Ensure slug exists
  const slug = (
    data.slug?.trim() ||
    `${data.brand}-${data.model}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  ).toLowerCase();

  const phonePayload = {
    slug,
    brand: data.brand.trim(),
    model: data.model.trim(),
    pricePkr: Math.max(0, Math.round(Number(data.pricePkr) || 0)),
    lowestVerifiedPrice: Math.max(0, Math.round(Number(data.lowestVerifiedPrice) || 0)),
    usdPrice: Number(data.usdPrice) || 0,
    image: data.image?.trim() || "",
    images: (data.images || []) as object,
    releaseDate: data.releaseDate?.trim() || "",
    status: data.status?.trim() || "Available",
    isActive: Boolean(data.isActive),
    popular: Boolean(data.popular),
    trendingRank: Number(data.trendingRank) || 0,
    ptaStatus: data.ptaStatus?.trim() || "",
    ptaTax: (data.ptaTax as object) || null,
    warranty: (data.warranty as object) || null,
    memory: (data.memory as object) || {},
    battery: (data.battery as object) || {},
    display: (data.display as object) || {},
    platform: (data.platform as object) || {},
    camera: (data.camera as object) || {},
    connectivity: (data.connectivity as object) || {},
  };

  try {
    let savedPhone;
    const isEdit = Boolean(data.id);

    if (isEdit) {
      // Check existing slug clash
      const existing = await prisma.phone.findFirst({
        where: { slug, NOT: { id: data.id } },
      });
      if (existing) {
        return { success: false, error: `Slug "${slug}" is already in use by another phone.` };
      }

      savedPhone = await prisma.phone.update({
        where: { id: data.id },
        data: phonePayload,
      });
    } else {
      // Create new phone
      const existing = await prisma.phone.findUnique({ where: { slug } });
      if (existing) {
        return { success: false, error: `Slug "${slug}" already exists. Please choose a different slug.` };
      }

      savedPhone = await prisma.phone.create({
        data: {
          ...phonePayload,
          legacyId: slug,
        },
      });
    }

    // Invalidate public caches immediately
    purgePhoneCaches(savedPhone.slug);
    if (data.slug && data.slug !== savedPhone.slug) {
      purgePhoneCaches(data.slug);
    }

    // Audit log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        action: isEdit ? "UPDATE_PHONE" : "CREATE_PHONE",
        entity: "PHONE",
        entityId: savedPhone.id,
        details: {
          phone: `${savedPhone.brand} ${savedPhone.model}`,
          slug: savedPhone.slug,
          pricePkr: savedPhone.pricePkr,
        },
      },
    });

    return {
      success: true,
      phone: {
        ...savedPhone,
        updatedAt: savedPhone.updatedAt.toISOString(),
      },
    };
  } catch (err: unknown) {
    console.error("savePhoneAction error:", err);
    const msg = err instanceof Error ? err.message : "Failed to save phone";
    return { success: false, error: msg };
  }
}

// ─── 5. Delete Phone ──────────────────────────────────────────────────────────
export async function deletePhoneAction(phoneId: string) {
  const { authenticated, user, error } = await verifyServerSession(["ADMIN"]);
  if (!authenticated || !user) {
    return { success: false, error: error || "Only Admins can delete phones" };
  }

  try {
    const phone = await prisma.phone.delete({
      where: { id: phoneId },
      select: { id: true, slug: true, brand: true, model: true },
    });

    purgePhoneCaches(phone.slug);

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        action: "DELETE_PHONE",
        entity: "PHONE",
        entityId: phone.id,
        details: { phone: `${phone.brand} ${phone.model}`, slug: phone.slug },
      },
    });

    return { success: true };
  } catch (err) {
    console.error("deletePhoneAction error:", err);
    return { success: false, error: "Failed to delete phone" };
  }
}

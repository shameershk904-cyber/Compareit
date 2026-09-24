"use client";

import { useState } from "react";
import {
  Megaphone,
  Plus,
  Upload,
  ExternalLink,
  Trash2,
  CheckCircle2,
  Eye,
  MousePointerClick,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";

export interface BannerRecord {
  id: string;
  title: string;
  desktopImage: string;
  mobileImage?: string | null;
  altText?: string | null;
  linkUrl: string;
  placement: "HERO" | "TOP_BAR" | "POPUP" | "SIDEBAR";
  priority: number;
  isActive: boolean;
  startDate?: string | null;
  endDate?: string | null;
  impressions: number;
  clicks: number;
  createdAt: string;
}

export function BannersClient({ initialBanners }: { initialBanners: BannerRecord[] }) {
  const [banners, setBanners] = useState<BannerRecord[]>(initialBanners);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [placement, setPlacement] = useState<"HERO" | "TOP_BAR" | "POPUP" | "SIDEBAR">("HERO");
  const [priority, setPriority] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setFormError("File size exceeds 2 MB limit.");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setFormError("");
  };

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!selectedFile) {
      setFormError("Please select a banner image (JPG, PNG, or WEBP under 2 MB).");
      return;
    }

    if (!title.trim()) {
      setFormError("Banner title is required.");
      return;
    }

    if (!linkUrl.trim()) {
      setFormError("Destination link URL is required.");
      return;
    }

    setUploading(true);
    try {
      // 1. Upload file to Supabase Storage
      const formData = new FormData();
      formData.append("file", selectedFile);

      const uploadRes = await fetch("/api/admin/banners/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadData.error || "Failed to upload image to Supabase Storage");
      }

      const desktopImageUrl = uploadData.url;

      // 2. Create banner record in database
      const createRes = await fetch("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          desktopImage: desktopImageUrl,
          linkUrl: linkUrl.trim(),
          placement,
          priority: Number(priority),
          isActive,
          startDate: startDate ? new Date(startDate).toISOString() : null,
          endDate: endDate ? new Date(endDate).toISOString() : null,
        }),
      });

      const createData = await createRes.json();
      if (!createRes.ok) {
        throw new Error(createData.error || "Failed to create banner record");
      }

      setFormSuccess("Banner successfully created and published!");
      setBanners([createData.banner, ...banners]);

      // Reset form
      setTimeout(() => {
        setIsModalOpen(false);
        setTitle("");
        setLinkUrl("");
        setSelectedFile(null);
        setPreviewUrl("");
        setPriority(0);
        setFormSuccess("");
      }, 1000);
    } catch (err: any) {
      setFormError(err.message || "An error occurred");
    } finally {
      setUploading(false);
    }
  };

  const handleToggleActive = async (banner: BannerRecord) => {
    const updatedStatus = !banner.isActive;
    try {
      const res = await fetch(`/api/admin/banners/${banner.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: updatedStatus }),
      });
      if (res.ok) {
        setBanners(
          banners.map((b) => (b.id === banner.id ? { ...b, isActive: updatedStatus } : b))
        );
      }
    } catch (err) {
      console.error("Toggle error:", err);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this banner?")) return;

    try {
      const res = await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
      if (res.ok) {
        setBanners(banners.filter((b) => b.id !== id));
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <div className="space-y-space-lg max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-lowest p-space-lg rounded-xl shadow-[0_1px_3px_rgba(15,23,42,0.04)] border border-border-hairline">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-deal-orange animate-ping"></span>
            <span className="text-label-sm font-label-sm tracking-wider uppercase text-deal-orange font-bold">
              Campaign Asset Orchestrator
            </span>
          </div>
          <h1 className="text-headline-md font-headline-md text-on-surface tracking-tight mt-1 flex items-center gap-2.5">
            <span className="material-symbols-outlined text-deal-orange text-[26px]">perm_media</span>
            <span>Banner &amp; Media Placement Manager</span>
          </h1>
          <p className="text-body-sm font-body-sm text-outline mt-0.5">
            Publish campaigns, upload banners to Supabase Storage, and measure impressions &amp; CTR across Pakistan.
          </p>
        </div>

        <button
          onClick={() => {
            setIsModalOpen(true);
            setFormError("");
            setFormSuccess("");
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-deal-orange hover:bg-deal-orange/90 text-on-primary font-bold text-label-md shadow-md shadow-deal-orange/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Banner</span>
        </button>
      </div>

      {/* Banners Grid / List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banners.map((banner) => {
          const ctr =
            banner.impressions > 0
              ? ((banner.clicks / banner.impressions) * 100).toFixed(1)
              : "0.0";

          return (
            <div
              key={banner.id}
              className="rounded-xl bg-surface-container-lowest border border-border-hairline overflow-hidden flex flex-col justify-between hover:shadow-md transition-all shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
            >
              {/* Image Preview */}
              <div className="relative aspect-video w-full bg-primary-container overflow-hidden border-b border-border-hairline">
                <img
                  src={banner.desktopImage}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-primary-container text-on-primary shadow-sm">
                    {banner.placement}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono text-on-primary bg-primary-container/80 backdrop-blur-md">
                    Pri: #{banner.priority}
                  </span>
                </div>

                <div className="absolute top-3 right-3">
                  <button
                    onClick={() => handleToggleActive(banner)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-all cursor-pointer shadow-sm ${
                      banner.isActive
                        ? "bg-secondary-container text-on-secondary-container"
                        : "bg-surface-subtle text-outline border border-border-hairline"
                    }`}
                  >
                    {banner.isActive ? "Live & Active" : "Paused"}
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-space-md flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-headline-sm font-headline-sm text-on-surface line-clamp-1">
                    {banner.title}
                  </h3>
                  <a
                    href={banner.linkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-body-sm font-body-sm text-outline hover:text-deal-orange flex items-center gap-1 mt-1 truncate"
                  >
                    <span className="truncate">{banner.linkUrl}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>

                {/* Performance Stats */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-surface-subtle border border-border-hairline text-center">
                  <div>
                    <div className="text-[10px] text-outline font-semibold uppercase flex items-center justify-center gap-1">
                      <Eye className="w-3 h-3 text-deal-orange" />
                      <span>Views</span>
                    </div>
                    <div className="text-body-md font-bold text-on-surface mt-0.5">
                      {banner.impressions.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-outline font-semibold uppercase flex items-center justify-center gap-1">
                      <MousePointerClick className="w-3 h-3 text-primary-container" />
                      <span>Clicks</span>
                    </div>
                    <div className="text-body-md font-bold text-on-surface mt-0.5">
                      {banner.clicks.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-outline font-semibold uppercase">CTR</div>
                    <div className="text-body-md font-bold text-deal-orange mt-0.5">{ctr}%</div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-border-hairline text-body-sm">
                  <span className="text-label-sm font-label-sm text-outline font-mono">
                    {new Date(banner.createdAt).toLocaleDateString()}
                  </span>

                  <button
                    onClick={() => handleDeleteBanner(banner.id)}
                    className="p-1.5 rounded-lg text-outline hover:text-rose-600 hover:bg-surface-subtle transition-all cursor-pointer"
                    title="Delete banner"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {banners.length === 0 && (
          <div className="col-span-full p-12 text-center rounded-xl bg-surface-container-lowest border border-border-hairline shadow-sm">
            <Megaphone className="w-8 h-8 text-outline mx-auto mb-3" />
            <h3 className="text-headline-sm font-headline-sm text-on-surface">No Banners Published Yet</h3>
            <p className="text-body-sm font-body-sm text-outline mt-1 max-w-sm mx-auto">
              Create your first promotional or sponsor banner to display on the public consumer site.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 px-4 py-2 rounded-lg bg-deal-orange text-on-primary font-bold text-label-md cursor-pointer hover:bg-deal-orange/90 transition-all shadow-sm"
            >
              Add First Banner
            </button>
          </div>
        )}
      </div>

      {/* Create Banner Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-primary/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-xl bg-surface-container-lowest border border-border-hairline p-6 shadow-2xl relative my-8 text-on-surface">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-subtle transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-lg bg-deal-orange/10 text-deal-orange border border-deal-orange/20">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-headline-sm font-headline-sm text-on-surface">Publish New Banner</h2>
                <p className="text-body-sm font-body-sm text-outline">
                  Upload image to Supabase Storage &amp; configure placement
                </p>
              </div>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 text-body-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-badge-emerald-tint border border-emerald-200 text-secondary text-body-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateBanner} className="space-y-4">
              {/* Image Upload Area */}
              <div>
                <label className="block text-label-sm font-label-sm text-outline uppercase mb-2">
                  Banner Image (Max 2 MB &bull; JPG, PNG, WEBP)
                </label>
                <div className="border-2 border-dashed border-border-hairline hover:border-deal-orange rounded-xl p-4 text-center cursor-pointer transition-colors relative bg-surface-subtle">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {previewUrl ? (
                    <div className="space-y-2">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-h-36 mx-auto rounded-lg object-contain shadow-sm"
                      />
                      <div className="text-label-sm font-label-sm text-deal-orange font-bold">
                        Click or drag to change image
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 space-y-1">
                      <Upload className="w-6 h-6 text-outline mx-auto mb-1" />
                      <div className="text-body-sm text-on-surface font-semibold">
                        Upload to Supabase &apos;banners&apos; bucket
                      </div>
                      <div className="text-label-sm font-label-sm text-outline">
                        Drag and drop or browse files
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-label-sm font-label-sm text-outline uppercase mb-1">
                  Campaign Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramadan Mobile Mega Sale 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-surface-subtle border border-border-hairline text-body-sm text-on-surface focus:outline-none focus:border-deal-orange"
                />
              </div>

              {/* Destination URL */}
              <div>
                <label className="block text-label-sm font-label-sm text-outline uppercase mb-1">
                  Destination URL
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://compareit.pk/compare?phones=..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-surface-subtle border border-border-hairline text-body-sm text-on-surface focus:outline-none focus:border-deal-orange"
                />
              </div>

              {/* Grid: Placement & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-label-sm font-label-sm text-outline uppercase mb-1">
                    Placement Slot
                  </label>
                  <select
                    value={placement}
                    onChange={(e) =>
                      setPlacement(e.target.value as "HERO" | "TOP_BAR" | "POPUP" | "SIDEBAR")
                    }
                    className="w-full px-3 py-2 rounded-lg bg-surface-subtle border border-border-hairline text-body-sm text-on-surface focus:outline-none focus:border-deal-orange"
                  >
                    <option value="HERO">Homepage Hero (728x90 / 1200x300)</option>
                    <option value="TOP_BAR">Product Page Top Bar</option>
                    <option value="SIDEBAR">Comparison Sticky Sidebar</option>
                    <option value="POPUP">PTA Tax Calculator Modal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-label-sm font-label-sm text-outline uppercase mb-1">
                    Priority Weight
                  </label>
                  <input
                    type="number"
                    value={priority}
                    onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 rounded-lg bg-surface-subtle border border-border-hairline text-body-sm text-on-surface focus:outline-none focus:border-deal-orange"
                  />
                </div>
              </div>

              {/* Schedule Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-label-sm font-label-sm text-outline uppercase mb-1">
                    Start Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-surface-subtle border border-border-hairline text-body-sm text-on-surface focus:outline-none focus:border-deal-orange"
                  />
                </div>

                <div>
                  <label className="block text-label-sm font-label-sm text-outline uppercase mb-1">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-surface-subtle border border-border-hairline text-body-sm text-on-surface focus:outline-none focus:border-deal-orange"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-hairline">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-surface-subtle hover:bg-surface-container text-on-surface text-label-md font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 rounded-lg bg-deal-orange hover:bg-deal-orange/90 text-on-primary text-label-md font-bold transition-all shadow-md shadow-deal-orange/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{uploading ? "Uploading to Storage..." : "Deploy Campaign"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

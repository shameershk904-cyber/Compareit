"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Smartphone,
  Search,
  Plus,
  Edit3,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
  DollarSign,
  Cpu,
  Layers,
  BatteryCharging,
  Camera,
} from "lucide-react";
import {
  fetchAdminPhonesAction,
  togglePhoneActiveAction,
  savePhoneAction,
  deletePhoneAction,
  type AdminPhoneFormData,
} from "@/app/(admin)/admin/phones/actions";

export interface PhoneListItem {
  id: string;
  legacyId?: string | null;
  slug: string;
  brand: string;
  model: string;
  pricePkr: number;
  lowestVerifiedPrice?: number;
  usdPrice?: number;
  image: string;
  releaseDate: string;
  status: string;
  isActive: boolean;
  popular: boolean;
  trendingRank: number;
  ptaStatus: string;
  ptaTax?: unknown;
  warranty?: unknown;
  memory?: unknown;
  battery?: unknown;
  display?: unknown;
  platform?: unknown;
  camera?: unknown;
  connectivity?: unknown;
  images?: unknown;
  updatedAt: string;
}

interface PhonesClientProps {
  initialPhones: PhoneListItem[];
  initialTotal: number;
  initialBrands: string[];
}

export function PhonesClient({
  initialPhones,
  initialTotal,
  initialBrands,
}: PhonesClientProps) {
  const [phones, setPhones] = useState<PhoneListItem[]>(initialPhones);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const totalPages = Math.ceil(total / pageSize) || 1;

  // Filters
  const [search, setSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "active" | "inactive">("all");

  const [isPending, startTransition] = useTransition();
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "pricing" | "specs" | "images">("general");
  const [editingPhone, setEditingPhone] = useState<PhoneListItem | null>(null);

  // Form State
  const [formData, setFormData] = useState<AdminPhoneFormData>({
    slug: "",
    brand: "",
    model: "",
    pricePkr: 0,
    lowestVerifiedPrice: 0,
    usdPrice: 0,
    image: "",
    images: [],
    releaseDate: "",
    status: "Available",
    isActive: true,
    popular: false,
    trendingRank: 0,
    ptaStatus: "PTA Approved",
    ptaTax: { passport: 0, cnic: 0 },
    warranty: { duration_months: 12, provider: "Official Brand Warranty" },
    display: { size: "", resolution: "", refresh_rate: "120Hz", type: "OLED" },
    platform: { os: "Android", chipset: "", cpu: "", gpu: "" },
    memory: { ram: "8GB", internal: "256GB" },
    battery: { capacity: "5000 mAh", fast_charging: "45W" },
    camera: { main: "50 MP", selfie: "16 MP" },
  });

  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const showToast = (type: "success" | "error", text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Re-fetch phones when filters/page change
  const reloadPhones = (newPage = page, newSearch = search, newBrand = selectedBrand, newStatus = selectedStatus) => {
    startTransition(async () => {
      const res = await fetchAdminPhonesAction({
        page: newPage,
        pageSize,
        search: newSearch,
        brand: newBrand,
        status: newStatus,
      });

      if (res.success && res.data) {
        setPhones(res.data.phones as PhoneListItem[]);
        setTotal(res.data.total);
        setPage(newPage);
      } else {
        showToast("error", res.error || "Failed to load phones");
      }
    });
  };

  // Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    reloadPhones(1, search, selectedBrand, selectedStatus);
  };

  // Filter changes
  const handleBrandChange = (brand: string) => {
    setSelectedBrand(brand);
    reloadPhones(1, search, brand, selectedStatus);
  };

  const handleStatusChange = (status: "all" | "active" | "inactive") => {
    setSelectedStatus(status);
    reloadPhones(1, search, selectedBrand, status);
  };

  // Toggle active/inactive
  const handleToggleActive = async (phone: PhoneListItem) => {
    const nextStatus = !phone.isActive;
    // Optimistic update
    setPhones((prev) =>
      prev.map((p) => (p.id === phone.id ? { ...p, isActive: nextStatus } : p))
    );

    const res = await togglePhoneActiveAction(phone.id, nextStatus);
    if (res.success) {
      showToast("success", `${phone.brand} ${phone.model} ${nextStatus ? "activated" : "deactivated"} (caches invalidated)`);
    } else {
      // Revert optimistic update
      setPhones((prev) =>
        prev.map((p) => (p.id === phone.id ? { ...p, isActive: phone.isActive } : p))
      );
      showToast("error", res.error || "Failed to update phone status");
    }
  };

  // Delete Phone
  const handleDeletePhone = async (phone: PhoneListItem) => {
    if (!confirm(`Are you sure you want to permanently delete "${phone.brand} ${phone.model}"?`)) {
      return;
    }

    startTransition(async () => {
      const res = await deletePhoneAction(phone.id);
      if (res.success) {
        showToast("success", `Deleted ${phone.brand} ${phone.model}`);
        reloadPhones();
      } else {
        showToast("error", res.error || "Failed to delete phone");
      }
    });
  };

  // Open Add Phone Modal
  const handleOpenAdd = () => {
    setEditingPhone(null);
    setFormData({
      slug: "",
      brand: "",
      model: "",
      pricePkr: 0,
      lowestVerifiedPrice: 0,
      usdPrice: 0,
      image: "",
      images: [],
      releaseDate: new Date().toISOString().split("T")[0],
      status: "Available",
      isActive: true,
      popular: false,
      trendingRank: 0,
      ptaStatus: "PTA Approved",
      ptaTax: { passport: 0, cnic: 0 },
      warranty: { duration_months: 12, provider: "Official Brand Warranty" },
      display: { size: "", resolution: "", refresh_rate: "120Hz", type: "AMOLED" },
      platform: { os: "Android 15", chipset: "", cpu: "", gpu: "" },
      memory: { ram: "8GB", internal: "256GB" },
      battery: { capacity: "5000 mAh", fast_charging: "45W" },
      camera: { main: "50 MP", selfie: "16 MP" },
    });
    setActiveTab("general");
    setFormError("");
    setIsModalOpen(true);
  };

  // Open Edit Phone Modal
  const handleOpenEdit = (phone: PhoneListItem) => {
    setEditingPhone(phone);
    const disp = (phone.display as Record<string, unknown>) || {};
    const plat = (phone.platform as Record<string, unknown>) || {};
    const mem = (phone.memory as Record<string, unknown>) || {};
    const batt = (phone.battery as Record<string, unknown>) || {};
    const cam = (phone.camera as Record<string, unknown>) || {};
    const ptaTax = (phone.ptaTax as { passport: number; cnic: number }) || { passport: 0, cnic: 0 };
    const warr = (phone.warranty as { duration_months: number; provider: string }) || {
      duration_months: 12,
      provider: "Official Warranty",
    };

    setFormData({
      id: phone.id,
      slug: phone.slug,
      brand: phone.brand,
      model: phone.model,
      pricePkr: phone.pricePkr,
      lowestVerifiedPrice: phone.lowestVerifiedPrice || phone.pricePkr,
      usdPrice: phone.usdPrice || 0,
      image: phone.image || "",
      images: Array.isArray(phone.images) ? (phone.images as string[]) : [],
      releaseDate: phone.releaseDate || "",
      status: phone.status || "Available",
      isActive: phone.isActive,
      popular: phone.popular,
      trendingRank: phone.trendingRank,
      ptaStatus: phone.ptaStatus || "PTA Approved",
      ptaTax,
      warranty: warr,
      display: disp,
      platform: plat,
      memory: mem,
      battery: batt,
      camera: cam,
    });
    setActiveTab("general");
    setFormError("");
    setIsModalOpen(true);
  };

  // Save form
  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.brand.trim() || !formData.model.trim()) {
      setFormError("Brand and Model are required.");
      return;
    }

    setFormSaving(true);
    setFormError("");

    const res = await savePhoneAction(formData);
    setFormSaving(false);

    if (res.success) {
      showToast(
        "success",
        `Saved ${formData.brand} ${formData.model}! Public cache automatically revalidated.`
      );
      setIsModalOpen(false);
      reloadPhones();
    } else {
      setFormError(res.error || "Failed to save phone");
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {actionMessage && (
        <div
          className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium transition-all ${
            actionMessage.type === "success"
              ? "bg-green-50 text-green-800 border-green-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {actionMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          )}
          <span>{actionMessage.text}</span>
          <button
            onClick={() => setActionMessage(null)}
            className="text-gray-400 hover:text-gray-600 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-surface-container-lowest p-6 rounded-2xl border border-border-hairline shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Smartphone className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-on-surface font-headline">Smartphone Catalog</h1>
          </div>
          <p className="text-sm text-on-surface-variant mt-1">
            Manage specs, retail pricing, PTA tax, and catalog status in Supabase Postgres.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-surface-container-low rounded-lg text-xs font-semibold text-on-surface-variant border border-border-hairline">
            Total Phones: <span className="text-primary font-bold">{total.toLocaleString()}</span>
          </div>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Add Phone
          </button>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-surface-container-lowest p-4 rounded-xl border border-border-hairline">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search by model, brand, or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-20 py-2 text-sm bg-surface-container-low border border-border-hairline rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-semibold bg-surface text-on-surface rounded border border-border-hairline hover:bg-surface-container transition"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-3">
          {/* Brand Filter */}
          <div className="flex items-center gap-2 text-sm">
            <Filter className="w-4 h-4 text-on-surface-variant" />
            <select
              value={selectedBrand}
              onChange={(e) => handleBrandChange(e.target.value)}
              className="text-xs font-medium bg-surface-container-low border border-border-hairline rounded-lg px-2.5 py-2 text-on-surface focus:outline-none"
            >
              <option value="all">All Brands ({initialBrands.length})</option>
              {initialBrands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter Toggle */}
          <div className="flex rounded-lg bg-surface-container-low p-1 border border-border-hairline text-xs font-medium">
            <button
              onClick={() => handleStatusChange("all")}
              className={`px-3 py-1 rounded-md transition ${
                selectedStatus === "all" ? "bg-surface shadow text-primary font-bold" : "text-on-surface-variant"
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleStatusChange("active")}
              className={`px-3 py-1 rounded-md transition ${
                selectedStatus === "active" ? "bg-surface shadow text-green-700 font-bold" : "text-on-surface-variant"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => handleStatusChange("inactive")}
              className={`px-3 py-1 rounded-md transition ${
                selectedStatus === "inactive" ? "bg-surface shadow text-red-600 font-bold" : "text-on-surface-variant"
              }`}
            >
              Inactive
            </button>
          </div>
        </div>
      </div>

      {/* Phones Table */}
      <div className="bg-surface-container-lowest rounded-2xl border border-border-hairline shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-container-low border-b border-border-hairline text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Device</th>
                <th className="py-3 px-4">Brand</th>
                <th className="py-3 px-4">Price (PKR)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Active</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-hairline text-on-surface">
              {isPending ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-on-surface-variant">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    Loading smartphones...
                  </td>
                </tr>
              ) : phones.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-on-surface-variant">
                    No smartphones match the given filters.
                  </td>
                </tr>
              ) : (
                phones.map((phone) => (
                  <tr key={phone.id} className="hover:bg-surface-container-low/50 transition">
                    {/* Device Thumbnail + Title */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-14 bg-surface-container rounded-lg overflow-hidden border border-border-hairline flex-shrink-0 flex items-center justify-center">
                          {phone.image ? (
                            <Image
                              src={phone.image}
                              alt={phone.model}
                              width={48}
                              height={56}
                              className="object-contain p-1 w-auto h-auto max-h-full"
                              unoptimized
                            />
                          ) : (
                            <Smartphone className="w-5 h-5 text-on-surface-variant/40" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-on-surface truncate">{phone.model}</p>
                          <p className="text-xs text-on-surface-variant font-mono truncate">{phone.slug}</p>
                        </div>
                      </div>
                    </td>

                    {/* Brand */}
                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface-container text-on-surface border border-border-hairline">
                        {phone.brand}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="py-3 px-4 font-medium">
                      {phone.pricePkr > 0 ? (
                        <div>
                          <span className="font-bold text-primary">
                            Rs. {phone.pricePkr.toLocaleString()}
                          </span>
                          {phone.lowestVerifiedPrice && phone.lowestVerifiedPrice !== phone.pricePkr ? (
                            <p className="text-xs text-on-surface-variant">
                              Lowest: Rs. {phone.lowestVerifiedPrice.toLocaleString()}
                            </p>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          Price N/A
                        </span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          phone.status === "Available"
                            ? "bg-green-100 text-green-800"
                            : phone.status === "Coming Soon"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {phone.status}
                      </span>
                    </td>

                    {/* Active Toggle Switch */}
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(phone)}
                        className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          phone.isActive ? "bg-green-600" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            phone.isActive ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/phone/${phone.slug}`}
                          target="_blank"
                          title="View on Public Site"
                          className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-lg transition"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleOpenEdit(phone)}
                          title="Edit Phone"
                          className="p-1.5 text-on-surface-variant hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePhone(phone)}
                          title="Delete Phone"
                          className="p-1.5 text-on-surface-variant hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-surface-container-low border-t border-border-hairline text-xs text-on-surface-variant">
          <div>
            Showing{" "}
            <span className="font-semibold text-on-surface">
              {total === 0 ? 0 : (page - 1) * pageSize + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-on-surface">
              {Math.min(page * pageSize, total)}
            </span>{" "}
            of <span className="font-semibold text-on-surface">{total.toLocaleString()}</span> phones
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => reloadPhones(page - 1)}
              disabled={page <= 1 || isPending}
              className="p-1.5 bg-surface border border-border-hairline rounded-md hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => reloadPhones(page + 1)}
              disabled={page >= totalPages || isPending}
              className="p-1.5 bg-surface border border-border-hairline rounded-md hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Phone Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-border-hairline my-8 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-hairline bg-surface-container-low">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-on-surface">
                  {editingPhone ? `Edit: ${editingPhone.brand} ${editingPhone.model}` : "Add New Smartphone"}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-on-surface-variant hover:bg-surface transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tab Navigation */}
            <div className="flex border-b border-border-hairline bg-surface px-6 pt-2 gap-2 text-xs font-semibold">
              <button
                onClick={() => setActiveTab("general")}
                className={`flex items-center gap-1.5 pb-2.5 px-3 border-b-2 transition ${
                  activeTab === "general"
                    ? "border-primary text-primary"
                    : "border-transparent text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                General Info
              </button>
              <button
                onClick={() => setActiveTab("pricing")}
                className={`flex items-center gap-1.5 pb-2.5 px-3 border-b-2 transition ${
                  activeTab === "pricing"
                    ? "border-primary text-primary"
                    : "border-transparent text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                Pricing & PTA
              </button>
              <button
                onClick={() => setActiveTab("specs")}
                className={`flex items-center gap-1.5 pb-2.5 px-3 border-b-2 transition ${
                  activeTab === "specs"
                    ? "border-primary text-primary"
                    : "border-transparent text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                Key Specs
              </button>
              <button
                onClick={() => setActiveTab("images")}
                className={`flex items-center gap-1.5 pb-2.5 px-3 border-b-2 transition ${
                  activeTab === "images"
                    ? "border-primary text-primary"
                    : "border-transparent text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Images
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSavePhone}>
              <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Tab 1: General Info */}
                {activeTab === "general" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                        Brand *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        placeholder="e.g. Apple, Samsung, Xiaomi"
                        className="w-full px-3 py-2 bg-surface border border-border-hairline rounded-lg text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                        Model *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.model}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        placeholder="e.g. iPhone 16 Pro Max"
                        className="w-full px-3 py-2 bg-surface border border-border-hairline rounded-lg text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                        Slug (URL identifier)
                      </label>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        placeholder="auto-generated from brand & model if empty"
                        className="w-full px-3 py-2 bg-surface border border-border-hairline rounded-lg text-on-surface text-sm font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                        Release Date
                      </label>
                      <input
                        type="text"
                        value={formData.releaseDate}
                        onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
                        placeholder="e.g. 2024-09-20"
                        className="w-full px-3 py-2 bg-surface border border-border-hairline rounded-lg text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                        Availability Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-3 py-2 bg-surface border border-border-hairline rounded-lg text-on-surface text-sm focus:outline-none"
                      >
                        <option value="Available">Available</option>
                        <option value="Coming Soon">Coming Soon</option>
                        <option value="Discontinued">Discontinued</option>
                        <option value="Rumored">Rumored</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                        Trending Rank
                      </label>
                      <input
                        type="number"
                        value={formData.trendingRank}
                        onChange={(e) => setFormData({ ...formData, trendingRank: Number(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-surface border border-border-hairline rounded-lg text-on-surface text-sm focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-6 pt-2">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-on-surface">
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                          className="w-4 h-4 rounded text-primary focus:ring-primary/20"
                        />
                        Active in Catalog
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-on-surface">
                        <input
                          type="checkbox"
                          checked={formData.popular}
                          onChange={(e) => setFormData({ ...formData, popular: e.target.checked })}
                          className="w-4 h-4 rounded text-primary focus:ring-primary/20"
                        />
                        Mark as Popular / Featured
                      </label>
                    </div>
                  </div>
                )}

                {/* Tab 2: Pricing & PTA */}
                {activeTab === "pricing" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                        Official Price (PKR)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.pricePkr}
                        onChange={(e) =>
                          setFormData({ ...formData, pricePkr: Math.max(0, Number(e.target.value) || 0) })
                        }
                        className="w-full px-3 py-2 bg-surface border border-border-hairline rounded-lg text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                        Estimated Market Price (PKR)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.lowestVerifiedPrice}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            lowestVerifiedPrice: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                        className="w-full px-3 py-2 bg-surface border border-border-hairline rounded-lg text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                        USD Price ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.usdPrice}
                        onChange={(e) => setFormData({ ...formData, usdPrice: Number(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-surface border border-border-hairline rounded-lg text-on-surface text-sm focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                        PTA Status
                      </label>
                      <select
                        value={formData.ptaStatus}
                        onChange={(e) => setFormData({ ...formData, ptaStatus: e.target.value })}
                        className="w-full px-3 py-2 bg-surface border border-border-hairline rounded-lg text-on-surface text-sm focus:outline-none"
                      >
                        <option value="PTA Approved">PTA Approved</option>
                        <option value="Non-PTA">Non-PTA</option>
                        <option value="Tax Applicable">Tax Applicable</option>
                        <option value="Discontinued">Discontinued</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                        PTA Tax on Passport (PKR)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.ptaTax?.passport ?? 0}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            ptaTax: {
                              passport: Number(e.target.value) || 0,
                              cnic: formData.ptaTax?.cnic ?? 0,
                            },
                          })
                        }
                        className="w-full px-3 py-2 bg-surface border border-border-hairline rounded-lg text-on-surface text-sm focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                        PTA Tax on CNIC (PKR)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.ptaTax?.cnic ?? 0}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            ptaTax: {
                              passport: formData.ptaTax?.passport ?? 0,
                              cnic: Number(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-full px-3 py-2 bg-surface border border-border-hairline rounded-lg text-on-surface text-sm focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Tab 3: Specs */}
                {activeTab === "specs" && (
                  <div className="space-y-4 text-sm">
                    {/* Display */}
                    <div className="p-3 bg-surface-container-low rounded-xl border border-border-hairline">
                      <h3 className="text-xs font-bold text-on-surface mb-2 flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-primary" /> Display
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div>
                          <label className="text-[11px] text-on-surface-variant">Size</label>
                          <input
                            type="text"
                            placeholder="6.9 inches"
                            value={String(formData.display?.size ?? "")}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                display: { ...formData.display, size: e.target.value },
                              })
                            }
                            className="w-full px-2 py-1 bg-surface border border-border-hairline rounded text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-on-surface-variant">Refresh Rate</label>
                          <input
                            type="text"
                            placeholder="120Hz"
                            value={String(formData.display?.refresh_rate ?? "")}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                display: { ...formData.display, refresh_rate: e.target.value },
                              })
                            }
                            className="w-full px-2 py-1 bg-surface border border-border-hairline rounded text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-on-surface-variant">Type</label>
                          <input
                            type="text"
                            placeholder="OLED / AMOLED"
                            value={String(formData.display?.type ?? "")}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                display: { ...formData.display, type: e.target.value },
                              })
                            }
                            className="w-full px-2 py-1 bg-surface border border-border-hairline rounded text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-on-surface-variant">Resolution</label>
                          <input
                            type="text"
                            placeholder="1320 x 2868"
                            value={String(formData.display?.resolution ?? "")}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                display: { ...formData.display, resolution: e.target.value },
                              })
                            }
                            className="w-full px-2 py-1 bg-surface border border-border-hairline rounded text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Platform & Chipset */}
                    <div className="p-3 bg-surface-container-low rounded-xl border border-border-hairline">
                      <h3 className="text-xs font-bold text-on-surface mb-2 flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-primary" /> Platform & Processor
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="text-[11px] text-on-surface-variant">OS</label>
                          <input
                            type="text"
                            placeholder="iOS 18 / Android 15"
                            value={String(formData.platform?.os ?? "")}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                platform: { ...formData.platform, os: e.target.value },
                              })
                            }
                            className="w-full px-2 py-1 bg-surface border border-border-hairline rounded text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-on-surface-variant">Chipset</label>
                          <input
                            type="text"
                            placeholder="Snapdragon 8 Elite / A18 Pro"
                            value={String(formData.platform?.chipset ?? "")}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                platform: { ...formData.platform, chipset: e.target.value },
                              })
                            }
                            className="w-full px-2 py-1 bg-surface border border-border-hairline rounded text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-on-surface-variant">CPU</label>
                          <input
                            type="text"
                            placeholder="Octa-core"
                            value={String(formData.platform?.cpu ?? "")}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                platform: { ...formData.platform, cpu: e.target.value },
                              })
                            }
                            className="w-full px-2 py-1 bg-surface border border-border-hairline rounded text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Battery & Camera */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 bg-surface-container-low rounded-xl border border-border-hairline">
                        <h3 className="text-xs font-bold text-on-surface mb-2 flex items-center gap-1.5">
                          <BatteryCharging className="w-3.5 h-3.5 text-primary" /> Battery
                        </h3>
                        <div className="space-y-2">
                          <div>
                            <label className="text-[11px] text-on-surface-variant">Capacity</label>
                            <input
                              type="text"
                              placeholder="5000 mAh"
                              value={String(formData.battery?.capacity ?? "")}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  battery: { ...formData.battery, capacity: e.target.value },
                                })
                              }
                              className="w-full px-2 py-1 bg-surface border border-border-hairline rounded text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-on-surface-variant">Charging</label>
                            <input
                              type="text"
                              placeholder="45W wired"
                              value={String(formData.battery?.fast_charging ?? "")}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  battery: { ...formData.battery, fast_charging: e.target.value },
                                })
                              }
                              className="w-full px-2 py-1 bg-surface border border-border-hairline rounded text-xs"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-surface-container-low rounded-xl border border-border-hairline">
                        <h3 className="text-xs font-bold text-on-surface mb-2 flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-primary" /> Camera
                        </h3>
                        <div className="space-y-2">
                          <div>
                            <label className="text-[11px] text-on-surface-variant">Main Camera</label>
                            <input
                              type="text"
                              placeholder="50 MP + 48 MP + 12 MP"
                              value={String(formData.camera?.main ?? "")}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  camera: { ...formData.camera, main: e.target.value },
                                })
                              }
                              className="w-full px-2 py-1 bg-surface border border-border-hairline rounded text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-on-surface-variant">Selfie Camera</label>
                            <input
                              type="text"
                              placeholder="12 MP / 32 MP"
                              value={String(formData.camera?.selfie ?? "")}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  camera: { ...formData.camera, selfie: e.target.value },
                                })
                              }
                              className="w-full px-2 py-1 bg-surface border border-border-hairline rounded text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 4: Images */}
                {activeTab === "images" && (
                  <div className="space-y-4 text-sm">
                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                        Main Image URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={formData.image}
                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                        className="w-full px-3 py-2 bg-surface border border-border-hairline rounded-lg text-on-surface text-sm focus:outline-none"
                      />
                    </div>

                    {formData.image && (
                      <div className="p-4 bg-surface-container-low rounded-xl border border-border-hairline flex items-center gap-4">
                        <div className="relative w-16 h-20 bg-surface rounded-lg overflow-hidden border border-border-hairline flex items-center justify-center flex-shrink-0">
                          <Image
                            src={formData.image}
                            alt="Preview"
                            width={64}
                            height={80}
                            className="object-contain p-1 w-auto h-auto max-h-full"
                            unoptimized
                          />
                        </div>
                        <div className="text-xs text-on-surface-variant">
                          <p className="font-semibold text-on-surface">Image Preview</p>
                          <p className="truncate max-w-sm mt-0.5">{formData.image}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-border-hairline bg-surface-container-low">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:text-on-surface transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={formSaving}
                  className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary-hover shadow-sm disabled:opacity-50 transition"
                >
                  {formSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      {editingPhone ? "Update Smartphone" : "Create Smartphone"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

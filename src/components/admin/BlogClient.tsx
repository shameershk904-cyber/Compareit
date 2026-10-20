"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  X,
  Pencil,
  FileText,
  ExternalLink,
} from "lucide-react";

export interface BlogPostRecord {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  coverImage?: string | null;
  author?: string | null;
  published: boolean;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

function slugifyPreview(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function BlogClient({ initialPosts }: { initialPosts: BlogPostRecord[] }) {
  const [posts, setPosts] = useState<BlogPostRecord[]>(initialPosts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPostRecord | null>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [published, setPublished] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const resetForm = () => {
    setTitle("");
    setSlug("");
    setExcerpt("");
    setContent("");
    setAuthor("");
    setPublished(false);
    setSelectedFile(null);
    setPreviewUrl("");
    setEditingPost(null);
    setSlugTouched(false);
    setFormError("");
    setFormSuccess("");
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (post: BlogPostRecord) => {
    setEditingPost(post);
    setTitle(post.title);
    setSlug(post.slug);
    setExcerpt(post.excerpt || "");
    setContent(post.content);
    setAuthor(post.author || "");
    setPublished(post.published);
    setSelectedFile(null);
    setPreviewUrl(post.coverImage || "");
    setSlugTouched(true);
    setFormError("");
    setFormSuccess("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slugTouched) {
      setSlug(slugifyPreview(value));
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!title.trim()) {
      setFormError("Title is required.");
      return;
    }
    if (!content.trim()) {
      setFormError("Content is required.");
      return;
    }

    setSaving(true);
    try {
      let coverImageUrl = editingPost?.coverImage || null;

      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        const uploadRes = await fetch("/api/admin/blog/upload", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || "Failed to upload cover image");
        }
        coverImageUrl = uploadData.url;
      }

      const payload = {
        title: title.trim(),
        slug: slug.trim() || undefined,
        excerpt: excerpt.trim() || null,
        content: content.trim(),
        coverImage: coverImageUrl,
        author: author.trim() || null,
        published,
      };

      if (editingPost) {
        const res = await fetch(`/api/admin/blog/${editingPost.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update post");

        const updated = {
          ...editingPost,
          ...data.post,
          publishedAt: data.post.publishedAt
            ? new Date(data.post.publishedAt).toISOString()
            : null,
          createdAt: new Date(data.post.createdAt).toISOString(),
          updatedAt: data.post.updatedAt
            ? new Date(data.post.updatedAt).toISOString()
            : undefined,
        } as BlogPostRecord;

        setPosts(posts.map((p) => (p.id === editingPost.id ? updated : p)));
        setFormSuccess("Post updated.");
      } else {
        const res = await fetch("/api/admin/blog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create post");

        const created = {
          ...data.post,
          publishedAt: data.post.publishedAt
            ? new Date(data.post.publishedAt).toISOString()
            : null,
          createdAt: new Date(data.post.createdAt).toISOString(),
          updatedAt: data.post.updatedAt
            ? new Date(data.post.updatedAt).toISOString()
            : undefined,
        } as BlogPostRecord;

        setPosts([created, ...posts]);
        setFormSuccess(published ? "Post published." : "Draft saved.");
      }

      setTimeout(() => closeModal(), 800);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublished = async (post: BlogPostRecord) => {
    const next = !post.published;
    try {
      const res = await fetch(`/api/admin/blog/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: next }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setPosts(
        posts.map((p) =>
          p.id === post.id
            ? {
                ...p,
                published: next,
                publishedAt: data.post.publishedAt
                  ? new Date(data.post.publishedAt).toISOString()
                  : null,
              }
            : p
        )
      );
    } catch (err) {
      console.error("Toggle publish error:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Permanently delete this blog post?")) return;
    try {
      const res = await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
      if (res.ok) setPosts(posts.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <div className="space-y-space-lg max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-lowest p-space-lg rounded-xl shadow-[0_1px_3px_rgba(15,23,42,0.04)] border border-border-hairline">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-deal-orange animate-ping" />
            <span className="text-label-sm font-label-sm tracking-wider uppercase text-deal-orange font-bold">
              Content Publishing
            </span>
          </div>
          <h1 className="text-headline-md font-headline-md text-on-surface tracking-tight mt-1 flex items-center gap-2.5">
            <span className="material-symbols-outlined text-deal-orange text-[26px]">article</span>
            <span>Blog Manager</span>
          </h1>
          <p className="text-body-sm font-body-sm text-outline mt-0.5">
            Create, edit, publish, and delete blog posts. Published posts appear on /blog.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-deal-orange hover:bg-deal-orange/90 text-on-primary font-bold text-label-md shadow-md shadow-deal-orange/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Post</span>
        </button>
      </div>

      <div className="rounded-xl bg-surface-container-lowest border border-border-hairline overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        {posts.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-8 h-8 text-outline mx-auto mb-3" />
            <h3 className="text-headline-sm font-headline-sm text-on-surface">No blog posts yet</h3>
            <p className="text-body-sm text-outline mt-1 max-w-sm mx-auto">
              Write your first article and publish it to show up on the public blog page.
            </p>
            <button
              onClick={openCreateModal}
              className="mt-4 px-4 py-2 rounded-lg bg-deal-orange text-on-primary font-bold text-label-md cursor-pointer hover:bg-deal-orange/90 transition-all shadow-sm"
            >
              Write First Post
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-body-sm">
              <thead className="bg-surface-subtle border-b border-border-hairline text-outline font-semibold uppercase tracking-wider text-label-sm">
                <tr>
                  <th className="py-3 px-4">Post</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Author</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-hairline">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-surface-subtle/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {post.coverImage ? (
                          <img
                            src={post.coverImage}
                            alt=""
                            className="w-12 h-12 rounded-lg object-cover shrink-0 border border-border-hairline"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-surface-subtle border border-border-hairline flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-outline" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-on-surface truncate">{post.title}</p>
                          <p className="text-[11px] text-outline font-mono truncate">/{post.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleTogglePublished(post)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase cursor-pointer transition-all ${
                          post.published
                            ? "bg-secondary-container text-on-secondary-container"
                            : "bg-surface-subtle text-outline border border-border-hairline"
                        }`}
                      >
                        {post.published ? "Published" : "Draft"}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-outline">{post.author || "—"}</td>
                    <td className="py-3 px-4 text-outline font-mono text-xs">
                      {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        {post.published && (
                          <a
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg text-outline hover:text-deal-orange hover:bg-surface-subtle transition-all"
                            title="View live"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => openEditModal(post)}
                          className="p-1.5 rounded-lg text-outline hover:text-deal-orange hover:bg-surface-subtle transition-all cursor-pointer"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="p-1.5 rounded-lg text-outline hover:text-rose-600 hover:bg-surface-subtle transition-all cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-primary/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-xl bg-surface-container-lowest border border-border-hairline p-6 shadow-2xl relative my-8 text-on-surface">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-subtle transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-lg bg-deal-orange/10 text-deal-orange border border-deal-orange/20">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-headline-sm font-headline-sm text-on-surface">
                  {editingPost ? "Edit Blog Post" : "New Blog Post"}
                </h2>
                <p className="text-body-sm text-outline">
                  {editingPost ? "Update content, cover, or publish status" : "Write and publish a new article"}
                </p>
              </div>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 text-body-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}
            {formSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-badge-emerald-tint border border-emerald-200 text-secondary text-body-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-label-sm font-semibold text-on-surface mb-1.5">
                  Title *
                </label>
                <input
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-surface-subtle border border-border-hairline text-body-sm focus:outline-none focus:border-deal-orange"
                  placeholder="e.g. Best Mid-Range Phones in Pakistan 2026"
                  required
                />
              </div>

              <div>
                <label className="block text-label-sm font-semibold text-on-surface mb-1.5">
                  URL Slug
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-outline font-mono">/blog/</span>
                  <input
                    value={slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setSlug(e.target.value);
                    }}
                    className="flex-1 px-3 py-2.5 rounded-lg bg-surface-subtle border border-border-hairline text-body-sm font-mono focus:outline-none focus:border-deal-orange"
                    placeholder="auto-generated-from-title"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-label-sm font-semibold text-on-surface mb-1.5">
                    Author
                  </label>
                  <input
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-surface-subtle border border-border-hairline text-body-sm focus:outline-none focus:border-deal-orange"
                    placeholder="CompareIt Team"
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={published}
                      onChange={(e) => setPublished(e.target.checked)}
                      className="w-4 h-4 rounded border-border-hairline text-deal-orange focus:ring-deal-orange"
                    />
                    <span className="text-body-sm font-semibold text-on-surface">
                      Publish immediately
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-label-sm font-semibold text-on-surface mb-1.5">
                  Excerpt
                </label>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  rows={2}
                  maxLength={500}
                  className="w-full px-3 py-2.5 rounded-lg bg-surface-subtle border border-border-hairline text-body-sm focus:outline-none focus:border-deal-orange resize-y"
                  placeholder="Short summary shown on the blog listing…"
                />
              </div>

              <div>
                <label className="block text-label-sm font-semibold text-on-surface mb-1.5">
                  Content *
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={10}
                  required
                  className="w-full px-3 py-2.5 rounded-lg bg-surface-subtle border border-border-hairline text-body-sm focus:outline-none focus:border-deal-orange resize-y font-mono"
                  placeholder="Write your article… Separate paragraphs with a blank line."
                />
              </div>

              <div>
                <label className="block text-label-sm font-semibold text-on-surface mb-1.5">
                  Cover Image
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <label className="flex-1 flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-lg border-2 border-dashed border-border-hairline hover:border-deal-orange/50 bg-surface-subtle cursor-pointer transition-colors">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <span className="text-body-sm text-outline text-center">
                      JPG, PNG, or WEBP · max 2 MB
                    </span>
                  </label>
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Cover preview"
                      className="w-full sm:w-40 h-28 rounded-lg object-cover border border-border-hairline"
                    />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg text-body-sm font-semibold text-outline hover:bg-surface-subtle cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-deal-orange hover:bg-deal-orange/90 text-on-primary font-bold text-label-md cursor-pointer disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {editingPost ? "Save Changes" : published ? "Publish Post" : "Save Draft"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

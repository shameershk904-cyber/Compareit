"use client";

import { useState, useRef } from "react";
import Link from "next/link";

type FormState = "idle" | "submitting" | "success" | "error";

const INQUIRY_TYPES = [
  { value: "price_report", label: "🚨  Report Incorrect Price", description: "Let us know if a price is outdated or wrong" },
  { value: "missing_phone", label: "📱  Missing Phone Listing", description: "Request a phone that isn't in our catalog" },
  { value: "partnership", label: "🤝  Partnership / Advertising", description: "Retailer integrations, sponsored placements" },
  { value: "data_update", label: "🔄  Request Data Update", description: "Specs, images, or launch info needs correcting" },
  { value: "technical", label: "🐛  Technical Issue / Bug", description: "Something broken on the site" },
  { value: "general", label: "💬  General Inquiry", description: "Anything else you'd like to discuss" },
];

const FAQ = [
  {
    q: "How often are prices updated?",
    a: "Our market prices are refreshed continuously from major Pakistani retailers including Hafeez Centre, PriceOye, Phone Bazaar, and more. Most prices are verified within 24–48 hours.",
  },
  {
    q: "Are the prices official or estimated?",
    a: "Prices are estimated open-market rates gathered from retailers across Pakistan. They reflect real buying prices, not official MSRP — which often differs significantly in the local market.",
  },
  {
    q: "How is the PTA DIRBS tax calculated?",
    a: "PTA tax is calculated based on the phone's USD value using the official DIRBS tariff schedule. Our built-in tax calculator applies the current bracket rates automatically.",
  },
  {
    q: "Can I add my store or listing?",
    a: "Yes! We welcome partnerships with verified retailers. Select 'Partnership / Advertising' in the contact form and our team will reach out within 48 hours.",
  },
  {
    q: "Why doesn't my phone appear in search results?",
    a: "We maintain a curated catalog of devices sold in Pakistan. If your phone is missing, use the 'Missing Phone Listing' inquiry type and we'll add it to the queue.",
  },
];

export function ContactClient() {
  const [activeInquiry, setActiveInquiry] = useState("general");
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [charCount, setCharCount] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormState("submitting");
    setErrorMessage("");

    const fd = new FormData(e.currentTarget);
    const payload = {
      name: fd.get("name") as string,
      email: fd.get("email") as string,
      inquiry: activeInquiry,
      subject: fd.get("subject") as string,
      message: fd.get("message") as string,
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to send message. Please try again.");
      }

      setFormState("success");
      formRef.current?.reset();
      setCharCount(0);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setErrorMessage(message);
      setFormState("error");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* ── Hero Banner ── */}
      <section className="relative bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center text-white">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 py-1.5 text-sm font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Usually replies within 24 hours
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold mb-4 tracking-tight drop-shadow-sm">
            Get In Touch
          </h1>
          <p className="text-base sm:text-lg text-white/85 max-w-xl mx-auto leading-relaxed">
            Wrong price? Missing phone? Partnership opportunity? We read every
            message and respond within one business day.
          </p>

          {/* Quick stat pills */}
          <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:justify-center sm:gap-3 mt-8 max-w-lg mx-auto">
            {[
              { icon: "📱", stat: "2,000+", label: "Phones listed" },
              { icon: "🏪", stat: "50+", label: "Retailers tracked" },
              { icon: "⚡", stat: "24h", label: "Response time" },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-white/15 backdrop-blur-sm border border-white/25 rounded-xl sm:rounded-2xl px-2 py-2.5 sm:px-5 sm:py-3 text-center"
              >
                <div className="text-base sm:text-xl">{item.icon}</div>
                <div className="text-sm sm:text-lg font-bold">{item.stat}</div>
                <div className="text-[10px] sm:text-xs text-white/70 leading-tight">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* ── LEFT: Contact Form ── */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Form header */}
            <div className="px-6 pt-7 pb-5 border-b border-gray-50">
              <h2 className="text-xl font-bold text-gray-900">Send us a message</h2>
              <p className="text-sm text-gray-500 mt-1">
                Choose an inquiry type to help us route your message faster.
              </p>
            </div>

            {formState === "success" ? (
              <div className="p-10 text-center flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-3xl">
                  ✅
                </div>
                <h3 className="text-xl font-bold text-gray-900">Message Sent!</h3>
                <p className="text-gray-500 text-sm max-w-sm">
                  Thanks for reaching out. We&apos;ll get back to you at the email address you provided within 24 hours.
                </p>
                <button
                  onClick={() => setFormState("idle")}
                  className="mt-2 px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Inquiry type picker */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Inquiry Type <span className="text-orange-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {INQUIRY_TYPES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setActiveInquiry(t.value)}
                        className={`flex flex-col items-start gap-0.5 px-3.5 py-3 rounded-xl border text-left transition-all text-sm ${
                          activeInquiry === t.value
                            ? "border-orange-400 bg-orange-50 text-orange-700"
                            : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <span className="font-semibold">{t.label}</span>
                        <span className="text-xs opacity-70">{t.description}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name + Email row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contact-name" className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Full Name <span className="text-orange-500">*</span>
                    </label>
                    <input
                      id="contact-name"
                      name="name"
                      type="text"
                      required
                      placeholder="Ahmed Khan"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Email Address <span className="text-orange-500">*</span>
                    </label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      required
                      placeholder="ahmed@example.com"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition"
                    />
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label htmlFor="contact-subject" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Subject <span className="text-orange-500">*</span>
                  </label>
                  <input
                    id="contact-subject"
                    name="subject"
                    type="text"
                    required
                    placeholder="e.g. Samsung Galaxy S25 price is incorrect"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition"
                  />
                </div>

                {/* Message */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="contact-message" className="text-sm font-semibold text-gray-700">
                      Message <span className="text-orange-500">*</span>
                    </label>
                    <span className={`text-xs font-medium ${charCount > 900 ? "text-red-500" : "text-gray-400"}`}>
                      {charCount}/1000
                    </span>
                  </div>
                  <textarea
                    id="contact-message"
                    name="message"
                    required
                    rows={5}
                    maxLength={1000}
                    placeholder="Describe your inquiry in as much detail as possible…"
                    onChange={(e) => setCharCount(e.target.value.length)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition"
                  />
                </div>

                {formState === "error" && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                    {errorMessage || "Something went wrong. Please try again or email us directly."}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={formState === "submitting"}
                  className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm shadow-orange-200"
                >
                  {formState === "submitting" ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                      Sending…
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m22 2-7 20-4-9-9-4Z" />
                        <path d="M22 2 11 13" />
                      </svg>
                      Send Message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ── RIGHT: Info + FAQ ── */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Contact cards */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-900">Other ways to reach us</h3>
            {[
              {
                icon: "📧",
                title: "Email",
                value: "hello@compareit.pk",
                sub: "For general inquiries",
                href: "mailto:hello@compareit.pk",
              },
              {
                icon: "🐛",
                title: "Bug Reports",
                value: "bugs@compareit.pk",
                sub: "Technical issues & errors",
                href: "mailto:bugs@compareit.pk",
              },
              {
                icon: "🤝",
                title: "Partnerships",
                value: "partners@compareit.pk",
                sub: "Retailers & advertisers",
                href: "mailto:partners@compareit.pk",
              },
            ].map((c) => (
              <a
                key={c.title}
                href={c.href}
                className="flex items-start gap-3.5 p-3.5 rounded-xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50 transition-all group"
              >
                <span className="text-2xl">{c.icon}</span>
                <div>
                  <div className="text-sm font-semibold text-gray-800 group-hover:text-orange-700 transition-colors">
                    {c.title}
                  </div>
                  <div className="text-sm text-orange-600 font-medium">{c.value}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{c.sub}</div>
                </div>
              </a>
            ))}
          </div>

          {/* Response time banner */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-bold text-emerald-700">Live Support Available</span>
            </div>
            <p className="text-xs text-emerald-700/80 leading-relaxed">
              Our team is based in Pakistan (PKT, UTC+5) and typically responds
              to all inquiries within 24 hours on business days.
            </p>
          </div>

          {/* Quick links */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-bold text-gray-900 mb-4">Quick Links</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { href: "/", label: "🏠 Home" },
                { href: "/trending", label: "🔥 Trending" },
                { href: "/new-in", label: "✨ New In" },
                { href: "/coming-soon", label: "🕐 Coming Soon" },
                { href: "/compare", label: "⚖️ Compare" },
                { href: "/admin", label: "🔐 Admin" },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="px-3 py-2 rounded-xl text-xs font-medium text-gray-600 hover:text-orange-700 hover:bg-orange-50 border border-gray-100 hover:border-orange-200 transition-all"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── FAQ Section ── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h2>
          <p className="text-gray-500 text-sm mt-2">
            Quick answers to common questions about CompareIt.pk
          </p>
        </div>
        <div className="space-y-3">
          {FAQ.map((item, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
              >
                <span className="text-sm font-semibold text-gray-800 pr-4">{item.q}</span>
                <svg
                  className={`w-4 h-4 shrink-0 text-gray-400 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-3">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

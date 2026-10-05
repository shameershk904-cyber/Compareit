"use client";

import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const BRANDS = ["Samsung", "Apple", "Oppo", "Huawei"];

interface NavItem {
  label: string;
  href: string;
  badge?: string;
  svgIcon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Home",
    href: "/",
    svgIcon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: "Trending",
    href: "/trending",
    badge: "Hot",
    svgIcon: (
      <svg className="w-4 h-4 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
      </svg>
    ),
  },
  {
    label: "New In",
    href: "/new-in",
    svgIcon: (
      <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      </svg>
    ),
  },
  {
    label: "Coming Soon",
    href: "/coming-soon",
    svgIcon: (
      <svg className="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    label: "Contact",
    href: "/contact",
    svgIcon: (
      <svg className="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    ),
  },
];

export function Header() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const initialQuery = searchParams.get("q") || "";
  
  const [query, setQuery] = useState(initialQuery);
  const [brandIndex, setBrandIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastScrollYRef = useRef(0);
  const tickingRef = useRef(false);
  const isMobileMenuOpenRef = useRef(false);
  isMobileMenuOpenRef.current = isMobileMenuOpen;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-hide topbar on scroll down; reveal on scroll up
  useEffect(() => {
    lastScrollYRef.current = window.scrollY;

    const updateHeaderVisibility = () => {
      if (isMobileMenuOpenRef.current) return;
      const currentY = window.scrollY;
      const lastY = lastScrollYRef.current;
      const delta = currentY - lastY;

      if (currentY < 16) {
        setIsHeaderHidden(false);
      } else if (delta > 6 && currentY > 64) {
        setIsHeaderHidden(true);
      } else if (delta < -6) {
        setIsHeaderHidden(false);
      }

      lastScrollYRef.current = currentY;
      tickingRef.current = false;
    };

    const onScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;
      window.requestAnimationFrame(updateHeaderVisibility);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Keep header visible while the mobile drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      setIsHeaderHidden(false);
    }
  }, [isMobileMenuOpen]);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsHeaderHidden(false);
  }, [pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  // Handle escape key to close mobile menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };
    if (isMobileMenuOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isFocused) {
      const q = searchParams.get("q") || "";
      const timer = setTimeout(() => setQuery(q), 0);
      return () => clearTimeout(timer);
    }
  }, [searchParams, isFocused]);

  // Typewriter animation: cycles through Samsung -> Apple -> Oppo -> Huawei
  useEffect(() => {
    if (isFocused || query) return;

    const currentBrand = BRANDS[brandIndex];

    if (!isDeleting && subIndex === currentBrand.length) {
      const pauseTimer = setTimeout(() => {
        setIsDeleting(true);
      }, 1600);
      return () => clearTimeout(pauseTimer);
    }

    if (isDeleting && subIndex === 0) {
      const pauseTimer = setTimeout(() => {
        setIsDeleting(false);
        setBrandIndex((prev) => (prev + 1) % BRANDS.length);
      }, 300);
      return () => clearTimeout(pauseTimer);
    }

    const speed = isDeleting ? 45 : 100;
    const timer = setTimeout(() => {
      setSubIndex((prev) => prev + (isDeleting ? -1 : 1));
    }, speed);

    return () => clearTimeout(timer);
  }, [subIndex, isDeleting, brandIndex, isFocused, query]);

  const scrollToPhones = () => {
    requestAnimationFrame(() => {
      const target = document.getElementById("products-section") || document.getElementById("phones-section") || document.querySelector(".products-section");
      if (target) {
        const headerEl = document.querySelector(".site-header");
        const headerOffset = headerEl ? headerEl.getBoundingClientRect().height + 15 : 120;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({
          top: Math.max(0, offsetPosition),
          behavior: "smooth"
        });
      }
    });
  };

  const scrollToAdvisor = () => {
    if (pathname !== "/") {
      router.push("/#advisor-section");
    } else {
      const el = document.getElementById("advisor-section") || document.querySelector(".advisor-section");
      if (el) {
        const headerEl = document.querySelector(".site-header");
        const headerOffset = headerEl ? headerEl.getBoundingClientRect().height + 15 : 120;
        const elementPosition = el.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({
          top: Math.max(0, offsetPosition),
          behavior: "smooth"
        });
      }
    }
  };

  const handleSearchSubmit = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    const trimmed = query.trim();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("phone-search", { detail: trimmed }));
      const currentParams = new URLSearchParams(window.location.search);
      if (trimmed) {
        currentParams.set("q", trimmed);
      } else {
        currentParams.delete("q");
      }
      const search = currentParams.toString();
      const url = search ? `/?${search}` : "/";
      window.history.replaceState(null, "", url);
    }
    
    if (trimmed.length >= 2) {
      try {
        const sid = typeof window !== "undefined" ? window.sessionStorage?.getItem("compareit_session_id") : null;
        fetch("/api/search/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: trimmed, sessionId: sid }),
          keepalive: true,
        }).catch(() => {});
      } catch {}
    }

    inputRef.current?.blur();

    if (pathname !== "/") {
      const search = trimmed ? `?q=${encodeURIComponent(trimmed)}&scroll=phones` : "?scroll=phones";
      router.push(`/${search}`);
    } else {
      scrollToPhones();
    }
  };

  const handleSearch = (val: string) => {
    setQuery(val);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("phone-search", { detail: val }));
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      if (typeof window !== "undefined") {
        const currentParams = new URLSearchParams(window.location.search);
        if (val.trim()) {
          currentParams.set("q", val.trim());
        } else {
          currentParams.delete("q");
        }
        const search = currentParams.toString();
        const url = search ? `/?${search}` : "/";
        window.history.replaceState(null, "", url);
      }
      
      if (val.trim().length >= 2) {
        try {
          const sid = typeof window !== "undefined" ? window.sessionStorage?.getItem("compareit_session_id") : null;
          fetch("/api/search/log", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: val.trim(), sessionId: sid }),
            keepalive: true,
          }).catch(() => {});
        } catch {}
      }
    }, 250);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearchSubmit();
    }
  };

  const handleClear = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setQuery("");
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("phone-search", { detail: "" }));
      const currentParams = new URLSearchParams(window.location.search);
      currentParams.delete("q");
      const search = currentParams.toString();
      const url = search ? `/?${search}` : "/";
      window.history.replaceState(null, "", url);
    }
    inputRef.current?.focus();
  };

  const isItemActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const displayedBrand = BRANDS[brandIndex].substring(0, subIndex);
  const placeholderText = isFocused || query ? "" : `Search for ${displayedBrand}`;

  return (
    <header
      className={`site-header${isHeaderHidden && !isMobileMenuOpen ? " is-hidden" : ""}`}
    >
      {/* ─── PRIMARY HEADER ROW (LOGO + SEARCH + ACTIONS / MOBILE TOGGLE) ─── */}
      <div className="container header-inner">
        <div className="logo-area">
          <Link href="/" className="brand-logo" aria-label="CompareIt.pk Homepage">
            <img src="/logo.png" alt="Compare It - Find, Compare, Get The Best" className="main-logo-img" />
          </Link>
        </div>

        {/* MAIN SEARCH BAR */}
        <div className="header-search">
          <div className="search-input-wrapper">
            <button 
              type="button" 
              className="search-icon-btn" 
              onClick={handleSearchSubmit} 
              title="Search phones"
              aria-label="Search phones"
            >
              🔍
            </button>
            <input 
              ref={inputRef}
              type="text" 
              id="global-search" 
              placeholder={placeholderText} 
              autoComplete="off" 
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
            <button 
              id="clear-search-btn" 
              type="button"
              className={`clear-btn ${!query ? 'hidden' : ''}`} 
              title="Clear search"
              aria-label="Clear search"
              onMouseDown={(e) => {
                e.preventDefault();
                handleClear();
              }}
              onClick={handleClear}
            >
              ✕
            </button>
          </div>
        </div>

        {/* HEADER ACTIONS (DESKTOP) */}
        <div className="header-actions">
          <button id="nav-finder-btn" className="action-btn advisor-btn" onClick={scrollToAdvisor}>
            <span className="btn-icon">✨</span>
            <span className="btn-label">Smart Phone Finder</span>
          </button>
          <button 
            id="open-tax-calc-btn" 
            className="action-btn tax-btn"
            onClick={() => {
              const currentParams = new URLSearchParams(Array.from(searchParams.entries()));
              currentParams.set("taxCalc", "open");
              const search = currentParams.toString();
              router.push(`${pathname}?${search}`, { scroll: false });
            }}
          >
            <span className="btn-icon">📋</span>
            <span className="btn-label">PTA Tax Calculator</span>
          </button>
          <Link href={pathname === "/compare" ? "/compare" : `/compare?from=${encodeURIComponent(pathname)}`} id="open-compare-btn" className="action-btn compare-btn">
            <span className="btn-icon">⚖️</span>
            <span className="btn-label">Quick Compare</span>
          </Link>
        </div>

        {/* MOBILE CONTROLS (HAMBURGER & COMPARE ICON) */}
        <div className="mobile-header-controls">
          <Link 
            href={pathname === "/compare" ? "/compare" : `/compare?from=${encodeURIComponent(pathname)}`}
            className="p-2 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors inline-flex items-center justify-center text-lg"
            title="Quick Compare"
            aria-label="Quick Compare"
          >
            ⚖️
          </Link>
          <button
            type="button"
            id="mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl text-gray-800 hover:text-gray-900 hover:bg-gray-100 transition-colors inline-flex items-center justify-center border border-gray-200 cursor-pointer"
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-nav-drawer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* ─── DESKTOP MAIN NAVIGATION SUB-BAR ─── */}
      <nav className="main-nav-bar" aria-label="Main Navigation">
        <div className="main-nav-inner">
          <ul className="main-nav-list">
            {NAV_ITEMS.map((item) => {
              const active = isItemActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`main-nav-item ${active ? "is-active" : ""}`}
                  >
                    {item.svgIcon}
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="nav-badge-hot">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Live Market Index ticker */}
          <div className="nav-market-status">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="pulse-dot" />
              Live Pakistan Market Index
            </span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-500 font-normal">PTA DIRBS Tax Calculator 2025</span>
          </div>
        </div>
      </nav>

      {/* ─── MOBILE SLIDE-OUT DRAWER PORTAL ─── */}
      {mounted && isMobileMenuOpen && typeof document !== "undefined" && createPortal(
        <div 
          className="mobile-nav-portal" 
          role="dialog" 
          aria-modal="true" 
          aria-label="Mobile Navigation"
          id="mobile-nav-drawer"
        >
          {/* Backdrop */}
          <div
            className="mobile-nav-backdrop"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer content */}
          <div className="mobile-nav-drawer">
            {/* Header */}
            <div className="mobile-nav-header">
              <Link 
                href="/" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2.5 no-underline"
              >
                <img src="/logo.png" alt="CompareIt.pk" className="h-7 w-auto object-contain" />
              </Link>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="mobile-nav-close-btn"
                aria-label="Close menu"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Navigation Body */}
            <div className="mobile-nav-body">
              <div className="mobile-nav-section-title">Main Pages</div>
              <nav className="flex flex-col gap-1 mb-5" aria-label="Mobile Main Navigation">
                {NAV_ITEMS.map((item) => {
                  const active = isItemActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`mobile-nav-link ${active ? "is-active" : ""}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="mobile-nav-icon">{item.svgIcon}</span>
                        <span className="font-medium text-sm">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="mobile-nav-badge">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Quick Tools in Drawer */}
              <div className="mobile-nav-section-title">Quick Tools & Calculators</div>
              <div className="flex flex-col gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    const currentParams = new URLSearchParams(Array.from(searchParams.entries()));
                    currentParams.set("taxCalc", "open");
                    router.push(`${pathname}?${currentParams.toString()}`, { scroll: false });
                  }}
                  className="mobile-nav-tool-btn"
                >
                  <span className="tool-emoji">📋</span>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-semibold text-gray-900">PTA DIRBS Tax Calculator</span>
                    <span className="text-[10px] text-gray-500">Calculate Passport & CNIC custom duties</span>
                  </div>
                </button>

                <Link
                  href={pathname === "/compare" ? "/compare" : `/compare?from=${encodeURIComponent(pathname)}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="mobile-nav-tool-btn"
                >
                  <span className="tool-emoji">⚖️</span>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-semibold text-gray-900">Side-by-Side Compare</span>
                    <span className="text-[10px] text-gray-500">Compare specs & prices of up to 4 phones</span>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    scrollToAdvisor();
                  }}
                  className="mobile-nav-tool-btn"
                >
                  <span className="tool-emoji">✨</span>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-semibold text-gray-900">Smart Phone Finder</span>
                    <span className="text-[10px] text-gray-500">Find the best match by budget and features</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="mobile-nav-footer">
              <span className="text-[11px] text-gray-500 font-medium">© 2025 CompareIt.pk</span>
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1.5">
                <span className="pulse-dot" />
                Live Rates
              </span>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}

"use client";

import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";

const BRANDS = ["Samsung", "Apple", "Oppo", "Huawei"];

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
  
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Only sync from searchParams when user is NOT actively typing/focused
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

    // Pause when brand is fully typed out
    if (!isDeleting && subIndex === currentBrand.length) {
      const pauseTimer = setTimeout(() => {
        setIsDeleting(true);
      }, 1600);
      return () => clearTimeout(pauseTimer);
    }

    // Finished deleting, move to next brand
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
        const headerOffset = 85;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({
          top: Math.max(0, offsetPosition),
          behavior: "smooth"
        });
      }
    });
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

    // Instant custom event so catalog filters with 0 lag
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
      
      // Telemetry: Log search query to search monitoring
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

  const displayedBrand = BRANDS[brandIndex].substring(0, subIndex);
  const placeholderText = isFocused || query ? "" : `Search for ${displayedBrand}`;

  return (
    <header className="site-header">
      <div className="container header-inner">
        <div className="logo-area">
          <Link href="/" className="brand-logo">
            {/* Supabase URL used here for logo if it's there, else a relative path. We'll use a relative path for now or standard img if it's in public */}
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

        {/* HEADER ACTIONS */}
        <div className="header-actions">
          <button id="nav-finder-btn" className="action-btn advisor-btn">
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
            <span className="btn-label">Compare</span>
            <span id="compare-badge" className="badge">3</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

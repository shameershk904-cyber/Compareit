"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";

export function Header() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const initialQuery = searchParams.get("q") || "";
  
  const [query, setQuery] = useState(initialQuery);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setQuery(searchParams.get("q") || "");
  }, [searchParams]);

  const handleSearch = (val: string) => {
    setQuery(val);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      const currentParams = new URLSearchParams(Array.from(searchParams.entries()));
      if (val.trim()) {
        currentParams.set("q", val.trim());
      } else {
        currentParams.delete("q");
      }
      
      const search = currentParams.toString();
      const url = search ? `/?${search}` : "/";
      
      if (pathname !== "/") {
        router.push(url);
      } else {
        router.replace(url, { scroll: false });
      }
    }, 300);
  };

  const handleClear = () => {
    setQuery("");
    const currentParams = new URLSearchParams(Array.from(searchParams.entries()));
    currentParams.delete("q");
    const search = currentParams.toString();
    const url = search ? `/?${search}` : "/";
    if (pathname !== "/") {
      router.push(url);
    } else {
      router.replace(url, { scroll: false });
    }
  };

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
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              id="global-search" 
              placeholder="Search phone name, brand (e.g. Note 40, S24 Ultra, Camon 30, Poco F6)..." 
              autoComplete="off" 
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
            />
            <button 
              id="clear-search-btn" 
              className={`clear-btn ${!query ? 'hidden' : ''}`} 
              title="Clear"
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
          <button id="open-compare-btn" className="action-btn compare-btn">
            <span className="btn-icon">⚖️</span>
            <span className="btn-label">Compare</span>
            <span id="compare-badge" className="badge">0</span>
          </button>
        </div>
      </div>
    </header>
  );
}

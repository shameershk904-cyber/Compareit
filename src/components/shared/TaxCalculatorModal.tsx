"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { type Phone } from "@/types";
import { formatPKR } from "@/lib/utils";

function calculateCustomPTATax(usdPrice: number) {
  const USD_TO_PKR = 278.50;
  if (usdPrice <= 30) return { passport: 430, cnic: 550 };
  if (usdPrice <= 100) return { passport: 3200, cnic: 4300 };
  if (usdPrice <= 200) return { passport: 9500, cnic: 12500 };
  if (usdPrice <= 350) return { passport: 19500, cnic: 25000 };
  if (usdPrice <= 500) return { passport: 41000, cnic: 51000 };

  const extra = Math.round((usdPrice - 500) * USD_TO_PKR * 0.17);
  return {
    passport: Math.min(145000, 70000 + extra),
    cnic: Math.min(175000, 85000 + extra)
  };
}

export function TaxCalculatorModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const isOpen = searchParams.has("taxCalc");
  const initialPhoneId = searchParams.get("taxCalc") !== "open" ? searchParams.get("taxCalc") : "";
  
  const [phones, setPhones] = useState<Phone[]>([]);
  const [activeTab, setActiveTab] = useState<"device" | "custom">("device");
  const [selectedPhoneId, setSelectedPhoneId] = useState<string>(initialPhoneId || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [customUsd, setCustomUsd] = useState<string>("");

  useEffect(() => {
    if (isOpen && phones.length === 0) {
      fetch("/data/phones.json")
        .then((res) => res.json())
        .then((data) => setPhones(data))
        .catch((err) => console.error("Failed to fetch phones for tax calc", err));
    }
  }, [isOpen, phones.length]);

  useEffect(() => {
    if (initialPhoneId && initialPhoneId !== "open") {
      setSelectedPhoneId(initialPhoneId);
      
      const phone = phones.find(p => p.id === initialPhoneId);
      if (phone) {
        setSearchQuery(`${phone.brand} ${phone.model}`);
      }
    }
  }, [initialPhoneId, phones]);

  if (!isOpen) return null;

  const handleClose = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("taxCalc");
    const newSearch = params.toString();
    const newUrl = newSearch ? `${pathname}?${newSearch}` : pathname;
    router.replace(newUrl, { scroll: false });
  };

  const handleOutsideClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).id === "tax-calc-modal") {
      handleClose();
    }
  };

  // Calculate current tax
  let calculatedTax = { passport: 0, cnic: 0 };
  
  if (activeTab === "device" && selectedPhoneId) {
    const p = phones.find((item) => item.id === selectedPhoneId);
    if (p) {
      calculatedTax = p.pta_tax || calculateCustomPTATax(p.usd_price || (p.price_pkr / 280));
    }
  } else if (activeTab === "custom") {
    const usd = parseFloat(customUsd);
    if (!isNaN(usd) && usd > 0) {
      calculatedTax = calculateCustomPTATax(usd);
    }
  }

  return (
    <div 
      id="tax-calc-modal" 
      className="modal-backdrop" 
      onClick={handleOutsideClick}
      style={{ zIndex: 9999 }} // Ensure it's on top
    >
      <div className="modal-dialog tax-calc-dialog">
        <div className="modal-header">
          <div className="modal-title-group">
            <h2>🇵🇰 PTA DIRBS Tax & Customs Duty Calculator</h2>
            <p className="modal-subtitle">Official FBR duty rates for personal mobile imports (Passport vs. CNIC)</p>
          </div>
          <button onClick={handleClose} className="modal-close-btn">✕</button>
        </div>
        
        <div className="modal-body">
          <div className="calc-tabs">
            <button 
              className={`calc-tab ${activeTab === "device" ? "active" : ""}`}
              onClick={() => setActiveTab("device")}
            >
              Select Phone
            </button>
            <button 
              className={`calc-tab ${activeTab === "custom" ? "active" : ""}`}
              onClick={() => setActiveTab("custom")}
            >
              Enter USD Value
            </button>
          </div>

          <div id="calc-device-view" className={`calc-view ${activeTab !== "device" ? "hidden" : ""}`}>
            <label className="filter-label">Choose Mobile Phone:</label>
            <input 
              type="text" 
              list="calc-phone-list" 
              className="calc-dropdown" 
              placeholder="Type to search phones... (e.g. iPhone 15)"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                const matched = phones.find(p => `${p.brand} ${p.model}` === e.target.value);
                if (matched) {
                  setSelectedPhoneId(matched.id);
                } else {
                  setSelectedPhoneId("");
                }
              }}
            />
            <datalist id="calc-phone-list">
              {phones.map((p) => (
                <option key={p.id} value={`${p.brand} ${p.model}`} />
              ))}
            </datalist>
          </div>

          <div id="calc-custom-view" className={`calc-view ${activeTab !== "custom" ? "hidden" : ""}`}>
            <label className="filter-label">Phone Invoice / C&F Value in USD ($):</label>
            <div className="input-box-lg">
              <span className="input-prefix-lg">$</span>
              <input 
                type="number" 
                placeholder="e.g. 799" 
                min="10" 
                max="3000"
                value={customUsd}
                onChange={(e) => setCustomUsd(e.target.value)}
              />
              <button className="primary-btn sm">Calculate</button>
            </div>
          </div>

          {/* CALCULATION RESULT BREAKDOWN */}
          <div className="calc-results-box">
            <div className="tax-card passport-card">
              <div className="tax-card-header">
                <span className="card-icon">🛂</span>
                <h4>Registered on Passport</h4>
                <span className="badge-discount">Discounted Rate</span>
              </div>
              <div className="tax-amount">{calculatedTax.passport > 0 ? formatPKR(calculatedTax.passport) : 'Rs. 0'}</div>
              <p className="tax-note">Requires valid international travel entry stamp within 60 days.</p>
            </div>

            <div className="tax-card cnic-card">
              <div className="tax-card-header">
                <span className="card-icon">🪪</span>
                <h4>Registered on CNIC</h4>
                <span className="badge-standard">Standard Local Rate</span>
              </div>
              <div className="tax-amount">{calculatedTax.cnic > 0 ? formatPKR(calculatedTax.cnic) : 'Rs. 0'}</div>
              <p className="tax-note">Payable directly via 1Link / JazzCash / EasyPaisa with DIRBS PSID.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { type Phone, type SpecItem } from "@/types";

export interface SpecCategory {
  key: string;
  title: string;
  subtitle: string;
  icon: string;
  iconBg: string;
  items: SpecItem[];
}

/**
 * Returns full WhatMobile-style 9-category technical specifications.
 * Uses phone.detailed_specs if present; otherwise generates high-fidelity
 * WhatMobile specification lines matching the exact structure from WhatMobile.com.pk
 */
export function getPhoneDetailedSpecs(phone: Phone): SpecCategory[] {
  const ds = phone.detailed_specs || {};

  // Safe RAM / Storage values
  const rawRam = phone.memory?.ram_gb;
  const rawStorage = phone.memory?.storage_gb;
  const safeRam = (rawRam && rawStorage && rawRam > rawStorage) ? rawStorage : (rawRam || 4);
  const safeStorage = (rawRam && rawStorage && rawRam > rawStorage) ? rawRam : (rawStorage || 64);

  // 1. BUILD
  const buildItems: SpecItem[] = ds["Build"] && ds["Build"].length > 0 ? ds["Build"] : [
    { label: "OS", value: phone.platform?.os || "Android 14 (or latest official firmware)" },
    { label: "UI", value: phone.platform?.os?.includes("One UI") ? "One UI 6.1" : phone.platform?.os?.includes("MIUI") ? "MIUI / HyperOS" : phone.brand === "Apple" ? "iOS" : "Official Manufacturer UI" },
    { label: "Dimensions", value: "Standard modern ergonomic slim profile" },
    { label: "Weight", value: phone.display?.size && phone.display.size > 6.7 ? "~210 g - 232 g" : "~185 g - 198 g" },
    { label: "SIM", value: "Dual SIM (Nano-SIM, dual stand-by) / eSIM support" },
    {
      label: "Colors",
      value: phone.color_variants && phone.color_variants.length > 0
        ? phone.color_variants.map(c => c.name).join(", ")
        : "Standard Editions (Black, Blue, Silver)"
    }
  ];

  // 2. FREQUENCY
  const frequencyItems: SpecItem[] = ds["Frequency"] && ds["Frequency"].length > 0 ? ds["Frequency"] : [
    { label: "2G Band", value: "SIM1: GSM 850 / 900 / 1800 / 1900, SIM2: GSM 850 / 900 / 1800 / 1900" },
    { label: "3G Band", value: "HSDPA 850 / 900 / 1700(AWS) / 1900 / 2100" },
    { label: "4G Band", value: "LTE band 1(2100), 2(1900), 3(1800), 4, 5(850), 7, 8, 20, 28, 38, 40, 41" },
    { label: "5G Band", value: phone.connectivity?.five_g ? "SA/NSA/Sub6 Multi-band 5G Supported" : "No (4G LTE-A VoLTE)" }
  ];

  // 3. PROCESSOR
  const processorItems: SpecItem[] = ds["Processor"] && ds["Processor"].length > 0 ? ds["Processor"] : [
    { label: "CPU", value: phone.platform?.cpu || "High-Efficiency Octa-core Processor" },
    { label: "Chipset", value: phone.platform?.chipset || "Multi-Core System on Chip (SoC)" },
    { label: "GPU", value: phone.platform?.gpu || "Integrated Graphic Engine" }
  ];

  // 4. DISPLAY
  const displayItems: SpecItem[] = ds["Display"] && ds["Display"].length > 0 ? ds["Display"] : [
    { label: "Technology", value: phone.display?.type || "High Resolution Touchscreen, Multitouch" },
    { label: "Size", value: `${phone.display?.size || 6.6} Inches` },
    { label: "Resolution", value: phone.display?.resolution || "1080 x 2400 Pixels (~395 PPI)" },
    { label: "Protection", value: phone.display?.protection || "Corning Gorilla Glass / Reinforced Glass" },
    { label: "Extra Features", value: "High Refresh Rate, Sunlight Contrast Ratio, Eye Care Mode" }
  ];

  // 5. MEMORY
  const memoryItems: SpecItem[] = ds["Memory"] && ds["Memory"].length > 0 ? ds["Memory"] : [
    { label: "Built-in", value: `${safeStorage}GB Built-in, ${safeRam}GB RAM` },
    { label: "Card", value: phone.memory?.card_slot ? "Yes, microSDXC dedicated/hybrid slot" : "No" }
  ];

  // 6. CAMERA
  const cameraItems: SpecItem[] = ds["Camera"] && ds["Camera"].length > 0 ? ds["Camera"] : [
    { label: "Main", value: phone.camera?.setup || `${phone.camera?.main_mp || 50} MP Primary Sensor with LED Flash` },
    { label: "Features", value: phone.camera?.features || "HDR, Night Mode, Portrait Mode, AI Scene Detection" },
    { label: "Front", value: `${phone.camera?.selfie_mp || 12} MP Front Facing Camera with Portrait Mode & AI Beauty` }
  ];

  // 7. CONNECTIVITY
  const connectivityItems: SpecItem[] = ds["Connectivity"] && ds["Connectivity"].length > 0 ? ds["Connectivity"] : [
    { label: "WLAN", value: "Wi-Fi 802.11 a/b/g/n/ac/6, Dual-band, Wi-Fi Direct, Hotspot" },
    { label: "Bluetooth", value: "v5.3 with A2DP, LE, Low Energy Transmission" },
    { label: "GPS", value: "Yes + A-GPS support & Glonass, BDS, GALILEO" },
    { label: "USB", value: "USB Type-C 2.0 / 3.2, OTG Support" },
    { label: "NFC", value: phone.connectivity?.nfc ? "Yes (Supports Contactless Payments)" : "No" },
    { label: "Data", value: phone.connectivity?.five_g ? "GPRS, Edge, 3G (HSPA), 4G LTE-A, 5G Capable" : "GPRS, Edge, 3G (HSPA), 4G LTE-A VoLTE" }
  ];

  // 8. FEATURES
  const featureItems: SpecItem[] = ds["Features"] && ds["Features"].length > 0 ? ds["Features"] : [
    { label: "Sensors", value: phone.connectivity?.fingerprint || "Fingerprint (Side-mounted or Under-display), Accelerometer, Proximity, Compass, Gyro" },
    { label: "Audio", value: phone.connectivity?.headphone_jack ? "Stereo Audio, 3.5mm Headphone Jack, Speaker Phone" : "High-Res Audio Tuned Speakers, Type-C Audio" },
    { label: "Browser", value: "HTML5" },
    { label: "Messaging", value: "SMS (threaded view), MMS, Email, Push Mail, IM" },
    { label: "Games", value: "Built-in + Downloadable from Google Play Store / App Store" },
    { label: "Torch", value: "Yes, High-intensity LED Flashlight" },
    { label: "Extra", value: "Dual SIM Active, Document Viewer, Photo/Video Editor, Voice Memo/Dial" }
  ];

  // 9. BATTERY
  const batteryItems: SpecItem[] = ds["Battery"] && ds["Battery"].length > 0 ? ds["Battery"] : [
    { label: "Capacity", value: `${phone.battery?.capacity_mah || 5000} mAh (Li-Po / Li-ion Non-removable)` },
    { label: "Charging", value: `${phone.battery?.charging_watt || 25}W Fast Charging ${phone.battery?.wireless_charging ? ", Wireless Charging Supported" : ""}` }
  ];

  return [
    {
      key: "build",
      title: "Build & Design",
      subtitle: `${buildItems.find(i => i.label === "OS")?.value || phone.platform?.os || "Android"} • ${buildItems.find(i => i.label === "SIM")?.value?.split("(")[0] || "Dual SIM"}`,
      icon: "architecture",
      iconBg: "bg-surface-container text-on-surface",
      items: buildItems
    },
    {
      key: "frequency",
      title: "Frequency & Network Bands",
      subtitle: frequencyItems.find(i => i.label === "5G Band")?.value?.includes("No") ? "Dual 4G LTE VoLTE" : "Multi-Band 5G SA/NSA Supported",
      icon: "cell_tower",
      iconBg: "bg-badge-blue-tint text-tertiary-container",
      items: frequencyItems
    },
    {
      key: "processor",
      title: "Processor & Platform",
      subtitle: `${processorItems.find(i => i.label === "Chipset")?.value || phone.platform?.chipset || "Octa-Core"}`,
      icon: "developer_board",
      iconBg: "bg-orange-100 text-deal-orange",
      items: processorItems
    },
    {
      key: "display",
      title: "Display & Visuals",
      subtitle: `${displayItems.find(i => i.label === "Size")?.value || phone.display?.size + " Inches"} • ${displayItems.find(i => i.label === "Technology")?.value?.split(",")[0] || phone.display?.type || "IPS LCD"}`,
      icon: "tv",
      iconBg: "bg-surface-container text-on-surface",
      items: displayItems
    },
    {
      key: "memory",
      title: "Memory & Storage",
      subtitle: `${safeStorage}GB ROM • ${safeRam}GB RAM • ${memoryItems.find(i => i.label === "Card")?.value?.includes("Yes") ? "MicroSD Slot" : "No Card Slot"}`,
      icon: "storage",
      iconBg: "bg-badge-blue-tint text-tertiary-container",
      items: memoryItems
    },
    {
      key: "camera",
      title: "Main & Selfie Camera",
      subtitle: `${cameraItems.find(i => i.label === "Main")?.value?.split("+")[0] || "High-Res Sensor"} • ${cameraItems.find(i => i.label === "Front")?.value?.split(",")[0] || "Selfie"}`,
      icon: "photo_camera",
      iconBg: "bg-surface-container text-on-surface",
      items: cameraItems
    },
    {
      key: "connectivity",
      title: "Connectivity & Ports",
      subtitle: `${connectivityItems.find(i => i.label === "WLAN")?.value?.split(",")[0] || "Wi-Fi"} • Bluetooth • ${connectivityItems.find(i => i.label === "USB")?.value?.split(",")[0] || "Type-C"}`,
      icon: "wifi",
      iconBg: "bg-surface-container text-on-surface",
      items: connectivityItems
    },
    {
      key: "features",
      title: "Features & Sensors",
      subtitle: `${featureItems.find(i => i.label === "Sensors")?.value?.split(",")[0] || "Fingerprint Sensor"} • Audio • Gyro`,
      icon: "sensors",
      iconBg: "bg-badge-emerald-tint text-secondary",
      items: featureItems
    },
    {
      key: "battery",
      title: "Battery & Charging",
      subtitle: `${batteryItems.find(i => i.label === "Capacity")?.value || phone.battery?.capacity_mah + " mAh"} • ${batteryItems.find(i => i.label === "Charging")?.value?.split(",")[0] || phone.battery?.charging_watt + "W Fast Charging"}`,
      icon: "battery_charging_full",
      iconBg: "bg-orange-100 text-deal-orange",
      items: batteryItems
    }
  ];
}

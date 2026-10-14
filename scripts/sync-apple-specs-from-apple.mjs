/**
 * Sync Apple iPhone specs from official Apple sources into phones.json (+ optional DB).
 *
 * Sources:
 *  - https://www.apple.com/{model}/specs/
 *  - https://support.apple.com/en-us/{id} (Tech Specs)
 *
 * Usage:
 *   node scripts/sync-apple-specs-from-apple.mjs
 *   node scripts/sync-apple-specs-from-apple.mjs --db
 */
import { existsSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const JSON_PATH = join(ROOT, "public", "data", "phones.json");
const SYNC_DB = process.argv.includes("--db");

function item(label, value) {
  return { label, value };
}

function detailedSpecs({
  os,
  dimensions,
  weight,
  sim,
  colors,
  cpu,
  chipset,
  gpu,
  displayTech,
  displaySize,
  displayRes,
  protection,
  displayExtra,
  storage,
  ram,
  cameraMain,
  cameraFeatures,
  cameraFront,
  wlan,
  bluetooth,
  gps,
  usb,
  sensors,
  audio,
  extras,
  battery,
  fiveG = true,
}) {
  return {
    Build: [
      item("OS", os),
      item("UI", "iOS"),
      item("Dimensions", dimensions),
      item("Weight", weight),
      item("SIM", sim),
      item("Colors", colors),
    ],
    Frequency: [
      item("2G Band", "GSM 850 / 900 / 1800 / 1900"),
      item("3G Band", "UMTS/HSPA+ 850 / 900 / 1700/2100 / 1900 / 2100"),
      item("4G Band", "Gigabit LTE with 4x4 MIMO (model-dependent bands)"),
      item("5G Band", fiveG ? "5G (sub-6 GHz / mmWave where supported) with 4x4 MIMO" : "No"),
    ],
    Processor: [
      item("CPU", cpu),
      item("Chipset", chipset),
      item("GPU", gpu),
    ],
    Display: [
      item("Technology", displayTech),
      item("Size", displaySize),
      item("Resolution", displayRes),
      item("Protection", protection),
      item("Extra Features", displayExtra),
    ],
    Memory: [
      item("Built-in", `${storage}GB Built-in, ${ram}GB RAM`),
      item("Card", "No"),
    ],
    Camera: [
      item("Main", cameraMain),
      item("Features", cameraFeatures),
      item("Front", cameraFront),
    ],
    Connectivity: [
      item("WLAN", wlan),
      item("Bluetooth", bluetooth),
      item("GPS", gps),
      item("USB", usb),
      item("NFC", "Yes"),
      item("Data", fiveG ? "GPRS, EDGE, 3G (HSPA), 4G LTE, 5G" : "GPRS, EDGE, 3G (HSPA), 4G LTE"),
    ],
    Features: [
      item("Sensors", sensors),
      item("Audio", audio),
      item("Browser", "Safari / HTML5"),
      item("Messaging", "iMessage, SMS (threaded view), MMS, Email, Push Email"),
      item("Games", "Built-in + Downloadable from App Store"),
      item("Torch", "Yes"),
      item("Extra", extras),
    ],
    Battery: [item("Capacity", battery)],
  };
}

/** Official Apple tech specs mapped into CompareIt phone fields. Source: apple.com / support.apple.com */
const APPLE_UPDATES = {
  "apple-iphone-duo": {
    source: "https://www.apple.com/iphone-duo/specs/",
    model: "iPhone Duo",
    display: {
      size: 7.6,
      type: "Super Retina XDR OLED folding (inner) + Super Retina XDR OLED (outer), ProMotion 120Hz, Always-On",
      resolution: "1878 x 2670 (inner @ 430 ppi) / 1398 x 2034 (outer @ 460 ppi)",
      protection: "Ceramic Shield 2 front, Ceramic Shield back",
    },
    platform: {
      chipset: "Apple A20 Pro",
      cpu: "Hexa-core (2 super cores + 4 efficiency cores)",
      gpu: "Apple GPU (7-core) with Neural Accelerators",
      os: "iOS 27",
      antutu_score: 2500000,
    },
    memory: { ram_gb: 12, storage_gb: 256, card_slot: false },
    battery: { capacity_mah: 3000, charging_watt: 60, wireless_charging: true },
    camera: {
      main_mp: 48,
      selfie_mp: 12,
      setup: "Dual Camera: 48MP Fusion Main (f/1.6, OIS) + 48MP Fusion Ultra Wide (f/2.2, 120°) with 2x optical-quality telephoto",
      features: "Smart Take, Duo Preview, Photonic Engine, Deep Fusion, Smart HDR 5, Night mode, Spatial photos, 48MP macro",
      video: "4K Dolby Vision up to 120 fps (Fusion Main), Action mode, Dual Capture, Audio Mix",
    },
    connectivity: { five_g: true, nfc: true, headphone_jack: false, fingerprint: "Touch ID (side button)" },
    detailed_specs: detailedSpecs({
      os: "iOS 27",
      dimensions: "Open: 117.8 x 164.6 x 5.2 mm; Closed: 117.8 x 84.1 x 11.3 mm",
      weight: "254 g",
      sim: "Dual eSIM (not compatible with physical SIM)",
      colors: "Night Sky, Star White",
      cpu: "Hexa-core (2x super cores + 4x efficiency cores)",
      chipset: "Apple A20 Pro",
      gpu: "Apple GPU (7-core) with Neural Accelerators, Dual 16-core Neural Engine",
      displayTech: "Super Retina XDR OLED (folding inner + outer), Capacitive Multitouch",
      displaySize: "7.6 Inches (inner) / 5.4 Inches (outer)",
      displayRes: "1878 x 2670 (inner, ~430 PPI) / 1398 x 2034 (outer, ~460 PPI)",
      protection: "Ceramic Shield 2 front, Ceramic Shield back, Titanium foldable design",
      displayExtra: "ProMotion 120Hz, Always-On, Dynamic Island, HDR, 1000/1600/3000 nits, nano-texture (inner), Apple Pencil (USB-C)",
      storage: 256,
      ram: 12,
      cameraMain:
        "Dual Camera: 48MP Fusion Main f/1.6 26mm sensor-shift OIS + 48MP Fusion Ultra Wide f/2.2 13mm 120°; 2x optical-quality telephoto",
      cameraFeatures:
        "Smart Take, Duo Preview, Photonic Engine, Deep Fusion, Smart HDR 5, Night mode, Spatial photos, 48MP macro, Dual Capture",
      cameraFront:
        "Outer 12MP Center Stage f/2.2 + Inner under-display FaceTime camera; 4K Dolby Vision video",
      wlan: "Wi-Fi 7 (802.11be) with 2x2 MIMO (Apple N1)",
      bluetooth: "v6 with A2DP, LE",
      gps: "Precision dual-frequency GPS, GLONASS, Galileo, QZSS, BeiDou, NavIC",
      usb: "USB Type-C 3 (up to 10Gb/s), DisplayPort",
      sensors: "Touch ID, Barometer, Gyro, High-g Accelerometer, Proximity, Four ambient light sensors",
      audio: "Stereo speakers, Spatial Audio, Wind noise reduction, Audio Mix",
      extras:
        "Titanium foldable design, IP68 (6m/30min), MagSafe/Qi2 up to 25W, Emergency SOS via satellite, Crash Detection, Dual batteries",
      battery:
        "Dual Li-Ion (non-removable); video playback up to 44h (outer) / 31h (inner); 50% in ~20 min with 60W USB-C",
    }),
  },

  "apple-iphone-18-pro": {
    source: "https://www.apple.com/iphone-18-pro/specs/",
    model: "iPhone 18 Pro",
    display: {
      size: 6.3,
      type: "Super Retina XDR OLED, ProMotion 120Hz, Always-On, 3000 nits outdoor",
      resolution: "1206 x 2622 pixels (~460 ppi)",
      protection: "Ceramic Shield 2 front, Ceramic Shield back",
    },
    platform: {
      chipset: "Apple A20 Pro",
      cpu: "Hexa-core (2 super cores + 4 efficiency cores)",
      gpu: "Apple GPU (7-core) with Neural Accelerators",
      os: "iOS 27",
      antutu_score: 2450000,
    },
    memory: { ram_gb: 12, storage_gb: 256, card_slot: false, virtual_ram_gb: 0 },
    battery: { capacity_mah: 3960, charging_watt: 60, wireless_charging: true },
    camera: {
      main_mp: 48,
      selfie_mp: 18,
      setup:
        "Triple Camera: 48MP Fusion Main (variable aperture f/1.48–f/4.0) + 48MP Fusion Ultra Wide + 48MP Fusion Telephoto (4x / 8x optical-quality)",
      features:
        "Variable aperture, Pro controls, ProRAW, Photonic Engine, Smart HDR 5, Night mode, Spatial photos, 48MP macro, LiDAR",
      video: "4K Dolby Vision up to 120 fps, ProRes/ProRes RAW, Apple Log 2, Action mode, Dual Capture",
    },
    connectivity: { five_g: true, nfc: true, headphone_jack: false, fingerprint: "Face ID" },
    detailed_specs: detailedSpecs({
      os: "iOS 27",
      dimensions: "150.0 x 71.9 x 8.75 mm",
      weight: "211 g",
      sim: "Dual eSIM (not compatible with physical SIM)",
      colors: "Black, Silver, Glacier, Burgundy",
      cpu: "Hexa-core (2x super cores + 4x efficiency cores)",
      chipset: "Apple A20 Pro",
      gpu: "Apple GPU (7-core) with Neural Accelerators, Dual 16-core Neural Engine",
      displayTech: "LTPO Super Retina XDR OLED Capacitive Touchscreen, Multitouch",
      displaySize: "6.3 Inches",
      displayRes: "1206 x 2622 Pixels (~460 PPI)",
      protection: "Ceramic Shield 2 front, Ceramic Shield back, Aluminum unibody",
      displayExtra:
        "ProMotion 120Hz, Always-On, Dynamic Island, HDR, 1000 nits typ / 1600 HDR / 3000 outdoor",
      storage: 256,
      ram: 12,
      cameraMain:
        "Triple Camera: 48MP Fusion Main variable aperture (f/1.48/1.8/2.8/4.0) 24mm OIS + 48MP Fusion Ultra Wide f/2.2 13mm + 48MP Fusion Telephoto 100mm 4x (8x optical-quality) tetraprism + LiDAR",
      cameraFeatures:
        "Variable aperture, Pro controls, ProRAW, Photonic Engine, Deep Fusion, Smart HDR 5, Night mode, Spatial photos, 48MP macro",
      cameraFront: "18MP Center Stage f/1.9, Focus Pixels, Retina Flash; 4K Dolby Vision / ProRes",
      wlan: "Wi-Fi 7 (802.11be) with 2x2 MIMO (Apple N1)",
      bluetooth: "v6 with A2DP, LE",
      gps: "Precision dual-frequency GPS, GLONASS, Galileo, QZSS, BeiDou, NavIC",
      usb: "USB Type-C 3 (up to 10Gb/s), DisplayPort",
      sensors: "Face ID, LiDAR, Barometer, Gyro, High-g Accelerometer, Proximity, Dual ambient light sensors",
      audio: "Stereo speakers, Four studio-quality mics, Spatial Audio, Audio Mix",
      extras:
        "Aluminum unibody, IP68 (6m/30min), MagSafe/Qi2 up to 25W, Action button, Camera Control, Apple C2 modem, Emergency SOS via satellite",
      battery:
        "Li-Ion (non-removable); typical use up to 24h; video up to 36h; 50% in ~15 min with 60W USB-C AVS",
    }),
  },

  "apple-iphone-18-pro-max": {
    source: "https://www.apple.com/iphone-18-pro/specs/",
    model: "iPhone 18 Pro Max",
    display: {
      size: 6.9,
      type: "Super Retina XDR OLED, ProMotion 120Hz, Always-On, 3000 nits outdoor",
      resolution: "1320 x 2868 pixels (~460 ppi)",
      protection: "Ceramic Shield 2 front, Ceramic Shield back",
    },
    platform: {
      chipset: "Apple A20 Pro",
      cpu: "Hexa-core (2 super cores + 4 efficiency cores)",
      gpu: "Apple GPU (7-core) with Neural Accelerators",
      os: "iOS 27",
      antutu_score: 2580000,
    },
    memory: { ram_gb: 12, storage_gb: 256, card_slot: false, virtual_ram_gb: 0 },
    battery: { capacity_mah: 4850, charging_watt: 60, wireless_charging: true },
    camera: {
      main_mp: 48,
      selfie_mp: 18,
      setup:
        "Triple Camera: 48MP Fusion Main (variable aperture f/1.48–f/4.0) + 48MP Fusion Ultra Wide + 48MP Fusion Telephoto (4x / 8x optical-quality)",
      features:
        "Variable aperture, Pro controls, ProRAW, Photonic Engine, Smart HDR 5, Night mode, Spatial photos, 48MP macro, LiDAR",
      video: "4K Dolby Vision up to 120 fps, ProRes/ProRes RAW, Apple Log 2, Action mode, Dual Capture",
    },
    connectivity: { five_g: true, nfc: true, headphone_jack: false, fingerprint: "Face ID" },
    detailed_specs: detailedSpecs({
      os: "iOS 27",
      dimensions: "163.4 x 78.0 x 8.75 mm",
      weight: "249 g",
      sim: "Dual eSIM (not compatible with physical SIM)",
      colors: "Black, Silver, Glacier, Burgundy",
      cpu: "Hexa-core (2x super cores + 4x efficiency cores)",
      chipset: "Apple A20 Pro",
      gpu: "Apple GPU (7-core) with Neural Accelerators, Dual 16-core Neural Engine",
      displayTech: "LTPO Super Retina XDR OLED Capacitive Touchscreen, Multitouch",
      displaySize: "6.9 Inches",
      displayRes: "1320 x 2868 Pixels (~460 PPI)",
      protection: "Ceramic Shield 2 front, Ceramic Shield back, Aluminum unibody",
      displayExtra:
        "ProMotion 120Hz, Always-On, Dynamic Island, HDR, 1000 nits typ / 1600 HDR / 3000 outdoor",
      storage: 256,
      ram: 12,
      cameraMain:
        "Triple Camera: 48MP Fusion Main variable aperture (f/1.48/1.8/2.8/4.0) 24mm OIS + 48MP Fusion Ultra Wide f/2.2 13mm + 48MP Fusion Telephoto 100mm 4x (8x optical-quality) tetraprism + LiDAR",
      cameraFeatures:
        "Variable aperture, Pro controls, ProRAW, Photonic Engine, Deep Fusion, Smart HDR 5, Night mode, Spatial photos, 48MP macro",
      cameraFront: "18MP Center Stage f/1.9, Focus Pixels, Retina Flash; 4K Dolby Vision / ProRes",
      wlan: "Wi-Fi 7 (802.11be) with 2x2 MIMO (Apple N1)",
      bluetooth: "v6 with A2DP, LE",
      gps: "Precision dual-frequency GPS, GLONASS, Galileo, QZSS, BeiDou, NavIC",
      usb: "USB Type-C 3 (up to 10Gb/s), DisplayPort",
      sensors: "Face ID, LiDAR, Barometer, Gyro, High-g Accelerometer, Proximity, Dual ambient light sensors",
      audio: "Stereo speakers, Four studio-quality mics, Spatial Audio, Audio Mix",
      extras:
        "Aluminum unibody, IP68 (6m/30min), MagSafe/Qi2 up to 25W, Action button, Camera Control, Apple C2 modem, Emergency SOS via satellite",
      battery:
        "Li-Ion (non-removable); typical use up to 30h; video up to 45h; 50% in ~15 min with 60W USB-C AVS",
    }),
  },

  "apple-iphone-17-pro": {
    source: "https://support.apple.com/en-us/125090",
    model: "iPhone 17 Pro",
    display: {
      size: 6.3,
      type: "Super Retina XDR OLED, ProMotion 120Hz, Always-On, 3000 nits outdoor",
      resolution: "1206 x 2622 pixels (~460 ppi)",
      protection: "Ceramic Shield 2",
    },
    platform: {
      chipset: "Apple A19 Pro",
      cpu: "Hexa-core (2 performance + 4 efficiency cores)",
      gpu: "Apple GPU (6-core) with Neural Accelerators",
      os: "iOS 26, upgradable to iOS 27",
      antutu_score: 2100000,
    },
    memory: { ram_gb: 12, storage_gb: 256, card_slot: false },
    battery: { capacity_mah: 3988, charging_watt: 40, wireless_charging: true },
    camera: {
      main_mp: 48,
      selfie_mp: 18,
      setup: "Triple Camera: 48MP Pro Fusion system with telephoto (up to 8x optical-quality on Pro Max class; 4x tetraprism on Pro)",
      features: "Photonic Engine, Deep Fusion, Smart HDR 5, Night mode, ProRAW, Spatial photos, LiDAR",
      video: "4K Dolby Vision, ProRes, Action mode, Dual Capture",
    },
    connectivity: { five_g: true, nfc: true, headphone_jack: false, fingerprint: "Face ID" },
    detailed_specs: detailedSpecs({
      os: "iOS 26, upgradable to iOS 27",
      dimensions: "150.0 x 71.9 x 8.75 mm",
      weight: "206 g",
      sim: "Dual eSIM (not compatible with physical SIM)",
      colors: "Cosmic Orange, Deep Blue, Silver",
      cpu: "Hexa-core (2x performance + 4x efficiency cores)",
      chipset: "Apple A19 Pro",
      gpu: "Apple GPU (6-core) with Neural Accelerators, 16-core Neural Engine",
      displayTech: "LTPO Super Retina XDR OLED Capacitive Touchscreen, Multitouch",
      displaySize: "6.3 Inches",
      displayRes: "1206 x 2622 Pixels (~460 PPI)",
      protection: "Ceramic Shield 2",
      displayExtra: "ProMotion 120Hz, Always-On, Dynamic Island, HDR, 1000/1600/3000 nits",
      storage: 256,
      ram: 12,
      cameraMain: "48MP Pro Fusion camera system (Main + Ultra Wide + Telephoto) with LiDAR Scanner",
      cameraFeatures: "Photonic Engine, Deep Fusion, Smart HDR 5, Night mode, ProRAW, Spatial photos, Camera Control",
      cameraFront: "18MP Center Stage f/1.9, Focus Pixels, Retina Flash; 4K Dolby Vision",
      wlan: "Wi-Fi 7 (802.11be) with 2x2 MIMO (Apple N1)",
      bluetooth: "v6 with A2DP, LE",
      gps: "Precision dual-frequency GPS, GLONASS, Galileo, QZSS, BeiDou, NavIC",
      usb: "USB Type-C 3 (up to 10Gb/s), DisplayPort",
      sensors: "Face ID, LiDAR, Barometer, Gyro, High-g Accelerometer, Proximity, Dual ambient light sensors",
      audio: "Stereo speakers, Spatial Audio, Wind noise reduction, Audio Mix",
      extras: "IP68 (6m/30min), MagSafe up to 25W, Action button, Camera Control, Emergency SOS via satellite",
      battery: "Li-Ion (non-removable); video playback up to 33h; 50% in 20 min with 40W USB-C",
    }),
  },

  "apple-iphone-17-pro-max": {
    source: "https://support.apple.com/en-us/125091",
    model: "iPhone 17 Pro Max",
    display: {
      size: 6.9,
      type: "Super Retina XDR OLED, ProMotion 120Hz, Always-On, 3000 nits outdoor",
      resolution: "1320 x 2868 pixels (~460 ppi)",
      protection: "Ceramic Shield 2",
    },
    platform: {
      chipset: "Apple A19 Pro",
      cpu: "Hexa-core (2 performance + 4 efficiency cores)",
      gpu: "Apple GPU (6-core) with Neural Accelerators",
      os: "iOS 26, upgradable to iOS 27",
      antutu_score: 2150000,
    },
    memory: { ram_gb: 12, storage_gb: 256, card_slot: false },
    battery: { capacity_mah: 4832, charging_watt: 40, wireless_charging: true },
    camera: {
      main_mp: 48,
      selfie_mp: 18,
      setup: "Triple Camera: 48MP Pro Fusion system with tetraprism telephoto (up to 8x optical-quality)",
      features: "Photonic Engine, Deep Fusion, Smart HDR 5, Night mode, ProRAW, Spatial photos, LiDAR",
      video: "4K Dolby Vision, ProRes, Action mode, Dual Capture",
    },
    connectivity: { five_g: true, nfc: true, headphone_jack: false, fingerprint: "Face ID" },
    detailed_specs: detailedSpecs({
      os: "iOS 26, upgradable to iOS 27",
      dimensions: "163.4 x 78.0 x 8.75 mm",
      weight: "233 g",
      sim: "Dual eSIM (not compatible with physical SIM)",
      colors: "Cosmic Orange, Deep Blue, Silver",
      cpu: "Hexa-core (2x performance + 4x efficiency cores)",
      chipset: "Apple A19 Pro",
      gpu: "Apple GPU (6-core) with Neural Accelerators, 16-core Neural Engine",
      displayTech: "LTPO Super Retina XDR OLED Capacitive Touchscreen, Multitouch",
      displaySize: "6.9 Inches",
      displayRes: "1320 x 2868 Pixels (~460 PPI)",
      protection: "Ceramic Shield 2",
      displayExtra: "ProMotion 120Hz, Always-On, Dynamic Island, HDR, 1000/1600/3000 nits",
      storage: 256,
      ram: 12,
      cameraMain: "48MP Pro Fusion camera system (Main + Ultra Wide + Telephoto tetraprism) with LiDAR Scanner",
      cameraFeatures: "Photonic Engine, Deep Fusion, Smart HDR 5, Night mode, ProRAW, Spatial photos, Camera Control",
      cameraFront: "18MP Center Stage f/1.9, Focus Pixels, Retina Flash; 4K Dolby Vision",
      wlan: "Wi-Fi 7 (802.11be) with 2x2 MIMO (Apple N1)",
      bluetooth: "v6 with A2DP, LE",
      gps: "Precision dual-frequency GPS, GLONASS, Galileo, QZSS, BeiDou, NavIC",
      usb: "USB Type-C 3 (up to 10Gb/s), DisplayPort",
      sensors: "Face ID, LiDAR, Barometer, Gyro, High-g Accelerometer, Proximity, Dual ambient light sensors",
      audio: "Stereo speakers, Spatial Audio, Wind noise reduction, Audio Mix",
      extras: "IP68 (6m/30min), MagSafe up to 25W, Action button, Camera Control, Emergency SOS via satellite",
      battery: "Li-Ion (non-removable); video playback up to 39h; 50% in 20 min with 40W USB-C",
    }),
  },

  "apple-iphone-17": {
    source: "https://www.apple.com/iphone-17/specs/",
    model: "iPhone 17",
    display: {
      size: 6.3,
      type: "Super Retina XDR OLED, ProMotion 120Hz, Always-On, 3000 nits outdoor",
      resolution: "1206 x 2622 pixels (~460 ppi)",
      protection: "Ceramic Shield 2 front, color-infused glass back",
    },
    platform: {
      chipset: "Apple A19",
      cpu: "Hexa-core (2 performance + 4 efficiency cores)",
      gpu: "Apple GPU (5-core) with Neural Accelerators",
      os: "iOS 26, upgradable to iOS 27",
      antutu_score: 1900000,
    },
    memory: { ram_gb: 8, storage_gb: 256, card_slot: false },
    battery: { capacity_mah: 3692, charging_watt: 40, wireless_charging: true },
    camera: {
      main_mp: 48,
      selfie_mp: 18,
      setup: "Dual Camera: 48MP Fusion Main (f/1.6, OIS) + 48MP Fusion Ultra Wide (f/2.2) with 2x optical-quality telephoto",
      features: "Photonic Engine, Deep Fusion, Smart HDR 5, Night mode, Spatial photos, 48MP macro, Camera Control",
      video: "4K Dolby Vision up to 60 fps, Action mode, Dual Capture, Spatial video, Audio Mix",
    },
    connectivity: { five_g: true, nfc: true, headphone_jack: false, fingerprint: "Face ID" },
    detailed_specs: detailedSpecs({
      os: "iOS 26, upgradable to iOS 27",
      dimensions: "149.6 x 71.5 x 7.95 mm",
      weight: "177 g",
      sim: "Dual eSIM (not compatible with physical SIM)",
      colors: "Black, White, Mist Blue, Sage, Lavender",
      cpu: "Hexa-core (2x performance + 4x efficiency cores)",
      chipset: "Apple A19",
      gpu: "Apple GPU (5-core) with Neural Accelerators, 16-core Neural Engine",
      displayTech: "LTPO Super Retina XDR OLED Capacitive Touchscreen, Multitouch",
      displaySize: "6.3 Inches",
      displayRes: "1206 x 2622 Pixels (~460 PPI)",
      protection: "Ceramic Shield 2 front, color-infused glass back, Aluminum design",
      displayExtra: "ProMotion 120Hz, Always-On, Dynamic Island, HDR, 1000/1600/3000 nits",
      storage: 256,
      ram: 8,
      cameraMain:
        "Dual Camera: 48MP Fusion Main f/1.6 26mm sensor-shift OIS + 48MP Fusion Ultra Wide f/2.2 13mm 120°; 2x optical-quality telephoto",
      cameraFeatures:
        "Photonic Engine, Deep Fusion, Smart HDR 5, Night mode, Spatial photos, 48MP macro, Camera Control, Photographic Styles",
      cameraFront: "18MP Center Stage f/1.9, Focus Pixels, Retina Flash; 4K Dolby Vision",
      wlan: "Wi-Fi 7 (802.11be) with 2x2 MIMO (Apple N1)",
      bluetooth: "v6 with A2DP, LE",
      gps: "Precision dual-frequency GPS, GLONASS, Galileo, QZSS, BeiDou, NavIC",
      usb: "USB Type-C 2 (up to 480Mb/s), DisplayPort",
      sensors: "Face ID, Barometer, Gyro, High-g Accelerometer, Proximity, Dual ambient light sensors",
      audio: "Stereo speakers, Spatial Audio, Wind noise reduction, Audio Mix",
      extras: "IP68 (6m/30min), MagSafe/Qi2 up to 25W, Action button, Camera Control, Emergency SOS via satellite",
      battery: "Li-Ion (non-removable); video playback up to 30h; 50% in 20 min with 40W USB-C",
    }),
  },

  "apple-iphone-17e": {
    source: "https://support.apple.com/en-us/126470",
    model: "iPhone 17e",
    display: {
      size: 6.1,
      type: "Super Retina XDR OLED, 800 nits typ / 1200 nits HDR",
      resolution: "1170 x 2532 pixels (~460 ppi)",
      protection: "Ceramic Shield glass",
    },
    platform: {
      chipset: "Apple A19",
      cpu: "Hexa-core (2 performance + 4 efficiency cores)",
      gpu: "Apple GPU (4-core) with Neural Accelerators",
      os: "iOS 26, upgradable to iOS 27",
      antutu_score: 1750000,
    },
    memory: { ram_gb: 8, storage_gb: 256, card_slot: false },
    battery: { capacity_mah: 4005, charging_watt: 20, wireless_charging: true },
    camera: {
      main_mp: 48,
      selfie_mp: 12,
      setup: "Single Camera: 48MP Fusion Main with 2x optical-quality telephoto",
      features: "Photonic Engine, Deep Fusion, Smart HDR, Night mode, Photographic Styles",
      video: "4K Dolby Vision up to 60 fps",
    },
    connectivity: { five_g: true, nfc: true, headphone_jack: false, fingerprint: "Face ID" },
    detailed_specs: detailedSpecs({
      os: "iOS 26, upgradable to iOS 27",
      dimensions: "146.7 x 71.5 x 7.80 mm",
      weight: "169 g",
      sim: "Dual eSIM (not compatible with physical SIM)",
      colors: "Black, White, Pink, Teal",
      cpu: "Hexa-core (2x performance + 4x efficiency cores)",
      chipset: "Apple A19",
      gpu: "Apple GPU (4-core) with Neural Accelerators, 16-core Neural Engine",
      displayTech: "Super Retina XDR OLED Capacitive Touchscreen, Multitouch",
      displaySize: "6.1 Inches",
      displayRes: "1170 x 2532 Pixels (~460 PPI)",
      protection: "Ceramic Shield glass",
      displayExtra: "HDR, True Tone, Wide color (P3), Haptic Touch, 800 nits typ / 1200 nits HDR",
      storage: 256,
      ram: 8,
      cameraMain: "48MP Fusion Main with optical image stabilization; 12MP 2x Telephoto (enabled by main sensor)",
      cameraFeatures: "Photonic Engine, Deep Fusion, Smart HDR, Night mode, Photographic Styles",
      cameraFront: "12MP TrueDepth camera with autofocus Focus Pixels, Retina Flash",
      wlan: "Wi-Fi 6 (802.11ax) with 2x2 MIMO",
      bluetooth: "v5.3 with A2DP, LE",
      gps: "GPS, GLONASS, Galileo, QZSS, BeiDou",
      usb: "USB Type-C 2",
      sensors: "Face ID, Barometer, Gyro, Accelerometer, Proximity, Ambient light sensor",
      audio: "Stereo speakers, Spatial Audio",
      extras: "IP68, MagSafe/Qi wireless charging, Emergency SOS via satellite, Crash Detection",
      battery: "Li-Ion (non-removable); video playback up to 26h; 50% in 30 min with 20W USB-C",
    }),
  },

  "apple-iphone-air": {
    source: "https://www.apple.com/iphone-air/specs/",
    model: "iPhone Air",
    display: {
      size: 6.5,
      type: "Super Retina XDR OLED, ProMotion 120Hz, Always-On, 3000 nits outdoor",
      resolution: "1260 x 2736 pixels (~460 ppi)",
      protection: "Ceramic Shield 2 front, Ceramic Shield back",
    },
    platform: {
      chipset: "Apple A19 Pro",
      cpu: "Hexa-core (2 performance + 4 efficiency cores)",
      gpu: "Apple GPU (5-core) with Neural Accelerators",
      os: "iOS 26, upgradable to iOS 27",
      antutu_score: 2000000,
    },
    memory: { ram_gb: 12, storage_gb: 256, card_slot: false },
    battery: { capacity_mah: 3149, charging_watt: 20, wireless_charging: true },
    camera: {
      main_mp: 48,
      selfie_mp: 18,
      setup: "Single Camera: 48MP Fusion Main (f/1.6, OIS) with 2x optical-quality telephoto",
      features: "Photonic Engine, Deep Fusion, Smart HDR 5, Night mode, Photographic Styles, Camera Control",
      video: "4K Dolby Vision up to 60 fps, Action mode, Dual Capture, Audio Mix",
    },
    connectivity: { five_g: true, nfc: true, headphone_jack: false, fingerprint: "Face ID" },
    detailed_specs: detailedSpecs({
      os: "iOS 26, upgradable to iOS 27",
      dimensions: "156.2 x 74.7 x 5.64 mm",
      weight: "165 g",
      sim: "Dual eSIM (not compatible with physical SIM)",
      colors: "Space Black, Cloud White, Light Gold, Sky Blue",
      cpu: "Hexa-core (2x performance + 4x efficiency cores)",
      chipset: "Apple A19 Pro",
      gpu: "Apple GPU (5-core) with Neural Accelerators, 16-core Neural Engine",
      displayTech: "LTPO Super Retina XDR OLED Capacitive Touchscreen, Multitouch",
      displaySize: "6.5 Inches",
      displayRes: "1260 x 2736 Pixels (~460 PPI)",
      protection: "Ceramic Shield 2 front, Ceramic Shield back, Titanium design",
      displayExtra: "ProMotion 120Hz, Always-On, Dynamic Island, HDR, 1000/1600/3000 nits",
      storage: 256,
      ram: 12,
      cameraMain: "48MP Fusion Main f/1.6 26mm sensor-shift OIS; 12MP 2x optical-quality telephoto",
      cameraFeatures: "Photonic Engine, Deep Fusion, Smart HDR 5, Night mode, Photographic Styles, Camera Control",
      cameraFront: "18MP Center Stage f/1.9, Focus Pixels, Retina Flash; 4K Dolby Vision",
      wlan: "Wi-Fi 7 (802.11be) with 2x2 MIMO (Apple N1)",
      bluetooth: "v6 with A2DP, LE",
      gps: "Precision dual-frequency GPS, GLONASS, Galileo, QZSS, BeiDou, NavIC",
      usb: "USB Type-C 2 (up to 480Mb/s)",
      sensors: "Face ID, Barometer, Gyro, High-g Accelerometer, Proximity, Dual ambient light sensors",
      audio: "Built-in speaker, Spatial Audio (with compatible AirPods), Wind noise reduction, Audio Mix",
      extras:
        "Titanium design (5.64mm thin), IP68, MagSafe/Qi2 up to 20W, Apple C1X modem, optional MagSafe Battery, Emergency SOS via satellite",
      battery:
        "Li-Ion (non-removable); video up to 27h (40h with MagSafe Battery); 50% in 30 min with 20W USB-C",
      fiveG: true,
    }),
  },

  "apple-iphone-16": {
    source: "https://support.apple.com/en-us/121029",
    model: "iPhone 16",
    display: {
      size: 6.1,
      type: "Super Retina XDR OLED, 2000 nits outdoor, Dynamic Island",
      resolution: "1179 x 2556 pixels (~460 ppi)",
      protection: "Ceramic Shield",
    },
    platform: {
      chipset: "Apple A18",
      cpu: "Hexa-core (2 performance + 4 efficiency cores)",
      gpu: "Apple GPU (5-core)",
      os: "iOS 18, upgradable to iOS 27",
      antutu_score: 1600000,
    },
    memory: { ram_gb: 8, storage_gb: 128, card_slot: false },
    battery: { capacity_mah: 3561, charging_watt: 20, wireless_charging: true },
    camera: {
      main_mp: 48,
      selfie_mp: 12,
      setup: "Dual Camera: 48MP Fusion Main (f/1.6, OIS) + 12MP Ultra Wide with 2x optical-quality telephoto",
      features: "Camera Control, Photonic Engine, Deep Fusion, Smart HDR 5, Night mode, Spatial photos",
      video: "4K Dolby Vision up to 60 fps, Spatial video, Audio Mix",
    },
    connectivity: { five_g: true, nfc: true, headphone_jack: false, fingerprint: "Face ID" },
    detailed_specs: detailedSpecs({
      os: "iOS 18, upgradable to iOS 27",
      dimensions: "147.6 x 71.6 x 7.80 mm",
      weight: "170 g",
      sim: "Dual eSIM / Nano-SIM + eSIM (region dependent)",
      colors: "Black, White, Pink, Teal, Ultramarine",
      cpu: "Hexa-core (2x performance + 4x efficiency cores)",
      chipset: "Apple A18 (3 nm)",
      gpu: "Apple GPU (5-core), 16-core Neural Engine",
      displayTech: "Super Retina XDR OLED Capacitive Touchscreen, Multitouch",
      displaySize: "6.1 Inches",
      displayRes: "1179 x 2556 Pixels (~460 PPI)",
      protection: "Ceramic Shield glass",
      displayExtra: "Dynamic Island, HDR, True Tone, 1000/1600/2000 nits",
      storage: 128,
      ram: 8,
      cameraMain:
        "Dual Camera: 48MP Fusion Main f/1.6 26mm sensor-shift OIS + 12MP Ultra Wide f/2.2 13mm 120°; 2x optical-quality telephoto",
      cameraFeatures: "Camera Control, Photonic Engine, Deep Fusion, Smart HDR 5, Night mode, Spatial photos",
      cameraFront: "12MP TrueDepth camera; 4K Dolby Vision video",
      wlan: "Wi-Fi 7 (802.11be) with 2x2 MIMO",
      bluetooth: "v5.3 with A2DP, LE",
      gps: "Precision dual-frequency GPS, GLONASS, Galileo, QZSS, BeiDou, NavIC",
      usb: "USB Type-C 2",
      sensors: "Face ID, Barometer, Gyro, Accelerometer, Proximity, Ambient light sensor",
      audio: "Stereo speakers, Spatial Audio",
      extras: "IP68, MagSafe up to 25W, Action button, Camera Control, Thread, Ultra Wideband",
      battery: "Li-Ion (non-removable); video playback up to 22h; 50% in ~30 min with 20W USB-C",
    }),
  },

  "apple-iphone-16-plus": {
    source: "https://support.apple.com/en-us/121030",
    model: "iPhone 16 Plus",
    display: {
      size: 6.7,
      type: "Super Retina XDR OLED, 2000 nits outdoor, Dynamic Island",
      resolution: "1290 x 2796 pixels (~460 ppi)",
      protection: "Ceramic Shield",
    },
    platform: {
      chipset: "Apple A18",
      cpu: "Hexa-core (2 performance + 4 efficiency cores)",
      gpu: "Apple GPU (5-core)",
      os: "iOS 18, upgradable to iOS 27",
      antutu_score: 1600000,
    },
    memory: { ram_gb: 8, storage_gb: 128, card_slot: false },
    battery: { capacity_mah: 4674, charging_watt: 20, wireless_charging: true },
    camera: {
      main_mp: 48,
      selfie_mp: 12,
      setup: "Dual Camera: 48MP Fusion Main (f/1.6, OIS) + 12MP Ultra Wide with 2x optical-quality telephoto",
      features: "Camera Control, Photonic Engine, Deep Fusion, Smart HDR 5, Night mode, Spatial photos",
      video: "4K Dolby Vision up to 60 fps, Spatial video, Audio Mix",
    },
    connectivity: { five_g: true, nfc: true, headphone_jack: false, fingerprint: "Face ID" },
    detailed_specs: detailedSpecs({
      os: "iOS 18, upgradable to iOS 27",
      dimensions: "160.9 x 77.8 x 7.80 mm",
      weight: "199 g",
      sim: "Dual eSIM / Nano-SIM + eSIM (region dependent)",
      colors: "Black, White, Pink, Teal, Ultramarine",
      cpu: "Hexa-core (2x performance + 4x efficiency cores)",
      chipset: "Apple A18 (3 nm)",
      gpu: "Apple GPU (5-core), 16-core Neural Engine",
      displayTech: "Super Retina XDR OLED Capacitive Touchscreen, Multitouch",
      displaySize: "6.7 Inches",
      displayRes: "1290 x 2796 Pixels (~460 PPI)",
      protection: "Ceramic Shield glass",
      displayExtra: "Dynamic Island, HDR, True Tone, 1000/1600/2000 nits",
      storage: 128,
      ram: 8,
      cameraMain:
        "Dual Camera: 48MP Fusion Main f/1.6 26mm sensor-shift OIS + 12MP Ultra Wide f/2.2 13mm 120°; 2x optical-quality telephoto",
      cameraFeatures: "Camera Control, Photonic Engine, Deep Fusion, Smart HDR 5, Night mode, Spatial photos",
      cameraFront: "12MP TrueDepth camera; 4K Dolby Vision video",
      wlan: "Wi-Fi 7 (802.11be) with 2x2 MIMO",
      bluetooth: "v5.3 with A2DP, LE",
      gps: "Precision dual-frequency GPS, GLONASS, Galileo, QZSS, BeiDou, NavIC",
      usb: "USB Type-C 2",
      sensors: "Face ID, Barometer, Gyro, Accelerometer, Proximity, Ambient light sensor",
      audio: "Stereo speakers, Spatial Audio",
      extras: "IP68, MagSafe up to 25W, Action button, Camera Control, Thread, Ultra Wideband",
      battery: "Li-Ion (non-removable); video playback up to 27h; 50% in ~30 min with 20W USB-C",
    }),
  },

  "apple-iphone-16-pro": {
    source: "https://support.apple.com/en-us/121031",
    model: "iPhone 16 Pro",
    display: {
      size: 6.3,
      type: "LTPO Super Retina XDR OLED, ProMotion 120Hz, Always-On, 2000 nits outdoor",
      resolution: "1206 x 2622 pixels (~460 ppi)",
      protection: "Ceramic Shield front, Titanium frame",
    },
    platform: {
      chipset: "Apple A18 Pro",
      cpu: "Hexa-core (2 performance + 4 efficiency cores)",
      gpu: "Apple GPU (6-core)",
      os: "iOS 18, upgradable to iOS 27",
      antutu_score: 1700000,
    },
    memory: { ram_gb: 8, storage_gb: 128, card_slot: false },
    battery: { capacity_mah: 3582, charging_watt: 20, wireless_charging: true },
    camera: {
      main_mp: 48,
      selfie_mp: 12,
      setup: "Triple Camera: 48MP Fusion Main + 48MP Ultra Wide + 12MP 5x Telephoto (tetraprism) with LiDAR",
      features: "Camera Control, ProRAW, Photonic Engine, Smart HDR 5, Night mode, Spatial photos, 48MP macro",
      video: "4K Dolby Vision up to 120 fps, ProRes, Apple Log, Action mode",
    },
    connectivity: { five_g: true, nfc: true, headphone_jack: false, fingerprint: "Face ID" },
    detailed_specs: detailedSpecs({
      os: "iOS 18, upgradable to iOS 27",
      dimensions: "149.6 x 71.5 x 8.25 mm",
      weight: "199 g",
      sim: "Dual eSIM (US models) / Nano-SIM + eSIM (region dependent)",
      colors: "Black Titanium, White Titanium, Natural Titanium, Desert Titanium",
      cpu: "Hexa-core (2x performance + 4x efficiency cores)",
      chipset: "Apple A18 Pro",
      gpu: "Apple GPU (6-core), 16-core Neural Engine",
      displayTech: "LTPO Super Retina XDR OLED Capacitive Touchscreen, Multitouch",
      displaySize: "6.3 Inches",
      displayRes: "1206 x 2622 Pixels (~460 PPI)",
      protection: "Ceramic Shield front, Grade 5 Titanium frame",
      displayExtra: "ProMotion 120Hz, Always-On, Dynamic Island, HDR, 1000/1600/2000 nits",
      storage: 128,
      ram: 8,
      cameraMain:
        "Triple Camera: 48MP Fusion Main f/1.78 24mm OIS + 48MP Ultra Wide f/2.2 13mm + 12MP 5x Telephoto 120mm tetraprism + LiDAR",
      cameraFeatures: "Camera Control, ProRAW, Photonic Engine, Smart HDR 5, Night mode, Spatial photos, 48MP macro",
      cameraFront: "12MP TrueDepth camera; 4K Dolby Vision / ProRes",
      wlan: "Wi-Fi 7 (802.11be) with 2x2 MIMO",
      bluetooth: "v5.3 with A2DP, LE",
      gps: "Precision dual-frequency GPS, GLONASS, Galileo, QZSS, BeiDou, NavIC",
      usb: "USB Type-C 3 (up to 10Gb/s), DisplayPort",
      sensors: "Face ID, LiDAR, Barometer, Gyro, High-g Accelerometer, Proximity, Dual ambient light sensors",
      audio: "Stereo speakers, Spatial Audio",
      extras: "Titanium design, IP68, MagSafe up to 25W, Action button, Camera Control, Ultra Wideband",
      battery: "Li-Ion (non-removable); video playback up to 22h; 50% in ~30 min with 20W USB-C",
    }),
  },

  "apple-iphone-16-pro-max": {
    source: "https://support.apple.com/en-us/121032",
    model: "iPhone 16 Pro Max",
    display: {
      size: 6.9,
      type: "LTPO Super Retina XDR OLED, ProMotion 120Hz, Always-On, 2000 nits outdoor",
      resolution: "1320 x 2868 pixels (~460 ppi)",
      protection: "Ceramic Shield front, Titanium frame",
    },
    platform: {
      chipset: "Apple A18 Pro",
      cpu: "Hexa-core (2 performance + 4 efficiency cores)",
      gpu: "Apple GPU (6-core)",
      os: "iOS 18, upgradable to iOS 27",
      antutu_score: 1720000,
    },
    memory: { ram_gb: 8, storage_gb: 256, card_slot: false },
    battery: { capacity_mah: 4685, charging_watt: 20, wireless_charging: true },
    camera: {
      main_mp: 48,
      selfie_mp: 12,
      setup: "Triple Camera: 48MP Fusion Main + 48MP Ultra Wide + 12MP 5x Telephoto (tetraprism) with LiDAR",
      features: "Camera Control, ProRAW, Photonic Engine, Smart HDR 5, Night mode, Spatial photos, 48MP macro",
      video: "4K Dolby Vision up to 120 fps, ProRes, Apple Log, Action mode",
    },
    connectivity: { five_g: true, nfc: true, headphone_jack: false, fingerprint: "Face ID" },
    detailed_specs: detailedSpecs({
      os: "iOS 18, upgradable to iOS 27",
      dimensions: "163.0 x 77.6 x 8.25 mm",
      weight: "227 g",
      sim: "Dual eSIM (US models) / Nano-SIM + eSIM (region dependent)",
      colors: "Black Titanium, White Titanium, Natural Titanium, Desert Titanium",
      cpu: "Hexa-core (2x performance + 4x efficiency cores)",
      chipset: "Apple A18 Pro",
      gpu: "Apple GPU (6-core), 16-core Neural Engine",
      displayTech: "LTPO Super Retina XDR OLED Capacitive Touchscreen, Multitouch",
      displaySize: "6.9 Inches",
      displayRes: "1320 x 2868 Pixels (~460 PPI)",
      protection: "Ceramic Shield front, Grade 5 Titanium frame",
      displayExtra: "ProMotion 120Hz, Always-On, Dynamic Island, HDR, 1000/1600/2000 nits",
      storage: 256,
      ram: 8,
      cameraMain:
        "Triple Camera: 48MP Fusion Main f/1.78 24mm OIS + 48MP Ultra Wide f/2.2 13mm + 12MP 5x Telephoto 120mm tetraprism + LiDAR",
      cameraFeatures: "Camera Control, ProRAW, Photonic Engine, Smart HDR 5, Night mode, Spatial photos, 48MP macro",
      cameraFront: "12MP TrueDepth camera; 4K Dolby Vision / ProRes",
      wlan: "Wi-Fi 7 (802.11be) with 2x2 MIMO",
      bluetooth: "v5.3 with A2DP, LE",
      gps: "Precision dual-frequency GPS, GLONASS, Galileo, QZSS, BeiDou, NavIC",
      usb: "USB Type-C 3 (up to 10Gb/s), DisplayPort",
      sensors: "Face ID, LiDAR, Barometer, Gyro, High-g Accelerometer, Proximity, Dual ambient light sensors",
      audio: "Stereo speakers, Spatial Audio",
      extras: "Titanium design, IP68, MagSafe up to 25W, Action button, Camera Control, Ultra Wideband",
      battery: "Li-Ion (non-removable); video playback up to 33h; 50% in ~30 min with 20W USB-C",
    }),
  },

  "apple-iphone-16e": {
    source: "https://support.apple.com/en-us/122208",
    model: "iPhone 16e",
    display: {
      size: 6.1,
      type: "Super Retina XDR OLED, 800 nits typ / 1200 nits HDR",
      resolution: "1170 x 2532 pixels (~460 ppi)",
      protection: "Ceramic Shield",
    },
    platform: {
      chipset: "Apple A18",
      cpu: "Hexa-core (2 performance + 4 efficiency cores)",
      gpu: "Apple GPU (4-core)",
      os: "iOS 18.3, upgradable to iOS 27",
      antutu_score: 1450000,
    },
    memory: { ram_gb: 8, storage_gb: 128, card_slot: false },
    battery: { capacity_mah: 4005, charging_watt: 20, wireless_charging: true },
    camera: {
      main_mp: 48,
      selfie_mp: 12,
      setup: "Single Camera: 48MP Fusion Main with 2x optical-quality telephoto",
      features: "Photonic Engine, Deep Fusion, Smart HDR, Night mode, Photographic Styles",
      video: "4K Dolby Vision up to 60 fps",
    },
    connectivity: { five_g: true, nfc: true, headphone_jack: false, fingerprint: "Face ID" },
    detailed_specs: detailedSpecs({
      os: "iOS 18.3, upgradable to iOS 27",
      dimensions: "146.7 x 71.5 x 7.80 mm",
      weight: "167 g",
      sim: "Dual eSIM (not compatible with physical SIM in many regions)",
      colors: "Black, White",
      cpu: "Hexa-core (2x performance + 4x efficiency cores)",
      chipset: "Apple A18",
      gpu: "Apple GPU (4-core), 16-core Neural Engine",
      displayTech: "Super Retina XDR OLED Capacitive Touchscreen, Multitouch",
      displaySize: "6.1 Inches",
      displayRes: "1170 x 2532 Pixels (~460 PPI)",
      protection: "Ceramic Shield glass",
      displayExtra: "HDR, True Tone, Wide color (P3), Haptic Touch, 800/1200 nits",
      storage: 128,
      ram: 8,
      cameraMain: "48MP Fusion Main with OIS; 12MP 2x Telephoto (enabled by main sensor)",
      cameraFeatures: "Photonic Engine, Deep Fusion, Smart HDR, Night mode, Photographic Styles",
      cameraFront: "12MP TrueDepth camera with Focus Pixels, Retina Flash",
      wlan: "Wi-Fi 6 (802.11ax) with 2x2 MIMO",
      bluetooth: "v5.3 with A2DP, LE",
      gps: "GPS, GLONASS, Galileo, QZSS, BeiDou",
      usb: "USB Type-C 2",
      sensors: "Face ID, Barometer, Gyro, Accelerometer, Proximity, Ambient light sensor",
      audio: "Stereo speakers",
      extras: "IP68, Qi wireless charging, Apple C1 modem, Emergency SOS via satellite",
      battery: "Li-Ion (non-removable); video playback up to 26h; 50% in 30 min with 20W USB-C",
    }),
  },

  "apple-iphone-15-plus": {
    source: "https://support.apple.com/en-us/111830",
    model: "iPhone 15 Plus",
    display: {
      size: 6.7,
      type: "Super Retina XDR OLED, 2000 nits outdoor, Dynamic Island",
      resolution: "1290 x 2796 pixels (~460 ppi)",
      protection: "Ceramic Shield",
    },
    platform: {
      chipset: "Apple A16 Bionic",
      cpu: "Hexa-core (2 performance + 4 efficiency cores)",
      gpu: "Apple GPU (5-core)",
      os: "iOS 17, upgradable to iOS 27",
      antutu_score: 1420000,
    },
    memory: { ram_gb: 6, storage_gb: 128, card_slot: false },
    battery: { capacity_mah: 4383, charging_watt: 20, wireless_charging: true },
    camera: {
      main_mp: 48,
      selfie_mp: 12,
      setup: "Dual Camera: 48MP Main (f/1.6, OIS) + 12MP Ultra Wide with 2x optical-quality telephoto",
      features: "Photonic Engine, Deep Fusion, Smart HDR 5, Night mode, Photographic Styles",
      video: "4K Dolby Vision up to 60 fps, Cinematic mode, Action mode",
    },
    connectivity: { five_g: true, nfc: true, headphone_jack: false, fingerprint: "Face ID" },
    detailed_specs: detailedSpecs({
      os: "iOS 17, upgradable to iOS 27",
      dimensions: "160.9 x 77.8 x 7.80 mm",
      weight: "201 g",
      sim: "Dual eSIM / Nano-SIM + eSIM (region dependent)",
      colors: "Black, Blue, Green, Yellow, Pink",
      cpu: "Hexa-core (2x performance + 4x efficiency cores)",
      chipset: "Apple A16 Bionic",
      gpu: "Apple GPU (5-core), 16-core Neural Engine",
      displayTech: "Super Retina XDR OLED Capacitive Touchscreen, Multitouch",
      displaySize: "6.7 Inches",
      displayRes: "1290 x 2796 Pixels (~460 PPI)",
      protection: "Ceramic Shield glass",
      displayExtra: "Dynamic Island, HDR, True Tone, 1000/1600/2000 nits",
      storage: 128,
      ram: 6,
      cameraMain:
        "Dual Camera: 48MP Main f/1.6 26mm sensor-shift OIS + 12MP Ultra Wide f/2.4 13mm 120°; 2x optical-quality telephoto",
      cameraFeatures: "Photonic Engine, Deep Fusion, Smart HDR 5, Night mode, Photographic Styles",
      cameraFront: "12MP TrueDepth camera; 4K Dolby Vision video",
      wlan: "Wi-Fi 6 (802.11ax) with 2x2 MIMO",
      bluetooth: "v5.3 with A2DP, LE",
      gps: "Precision dual-frequency GPS, GLONASS, Galileo, QZSS, BeiDou",
      usb: "USB Type-C 2",
      sensors: "Face ID, Barometer, Gyro, Accelerometer, Proximity, Ambient light sensor",
      audio: "Stereo speakers",
      extras: "IP68, MagSafe up to 15W, Emergency SOS via satellite, Crash Detection",
      battery: "Li-Ion (non-removable); video playback up to 26h; 50% in 30 min with 20W USB-C",
    }),
  },
};

function applyUpdate(phone, update) {
  const next = { ...phone };
  if (update.model) next.model = update.model;
  if (update.display) next.display = { ...phone.display, ...update.display };
  if (update.platform) next.platform = { ...phone.platform, ...update.platform };
  if (update.memory) next.memory = { ...phone.memory, ...update.memory };
  if (update.battery) next.battery = { ...phone.battery, ...update.battery };
  if (update.camera) next.camera = { ...phone.camera, ...update.camera };
  if (update.connectivity) next.connectivity = { ...phone.connectivity, ...update.connectivity };
  if (update.detailed_specs) next.detailed_specs = update.detailed_specs;
  next.specs_source = update.source;
  return next;
}

async function syncDb(updatedSlugs, phones) {
  const dotenv = await import("dotenv");
  const envLocal = join(ROOT, ".env.local");
  const envFile = join(ROOT, ".env");
  if (existsSync(envLocal)) dotenv.config({ path: envLocal });
  else if (existsSync(envFile)) dotenv.config({ path: envFile });

  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  let ok = 0;
  try {
    for (const slug of updatedSlugs) {
      const p = phones.find((x) => x.slug === slug);
      if (!p) continue;
      await prisma.phone.updateMany({
        where: { OR: [{ slug }, { legacyId: slug }] },
        data: {
          model: p.model,
          display: p.display,
          platform: p.platform,
          memory: p.memory,
          battery: p.battery,
          camera: p.camera,
          connectivity: p.connectivity,
          detailedSpecs: p.detailed_specs ?? {},
        },
      });
      ok++;
    }
    console.log(`DB updated: ${ok} Apple phones`);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const phones = JSON.parse(readFileSync(JSON_PATH, "utf8"));
  const updated = [];

  for (const [slug, update] of Object.entries(APPLE_UPDATES)) {
    const idx = phones.findIndex((p) => p.slug === slug || p.id === slug);
    if (idx < 0) {
      console.warn(`SKIP missing phone: ${slug}`);
      continue;
    }
    phones[idx] = applyUpdate(phones[idx], update);
    updated.push(slug);
    console.log(`OK  ${slug}  ← ${update.source}`);
  }

  writeFileSync(JSON_PATH, JSON.stringify(phones, null, 2) + "\n");
  console.log(`\nWrote ${updated.length} Apple updates → public/data/phones.json`);

  if (SYNC_DB) {
    await syncDb(updated, phones);
  } else {
    console.log("JSON only. Re-run with --db to push into Supabase.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

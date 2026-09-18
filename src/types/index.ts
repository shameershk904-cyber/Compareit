export interface Retailer {
  store: string;
  price: number;
  delivery: string;
  in_stock: boolean;
  condition: string;
  url: string;
}

export interface Phone {
  id: string;
  brand: string;
  model: string;
  slug: string;
  image: string;
  price_pkr: number;
  usd_price: number;
  lowest_verified_price?: number;
  release_date: string;
  trending_rank?: number;
  popular?: boolean;
  pta_status: "approved" | "non_pta" | string;
  pta_tax?: {
    passport: number;
    cnic: number;
  };
  memory: {
    ram_gb: number;
    card_slot: boolean;
    storage_gb: number;
    virtual_ram_gb?: number;
  };
  battery: {
    charging_watt: number;
    wireless_charging: boolean;
    capacity_mah: number;
  };
  connectivity: {
    headphone_jack: boolean;
    five_g: boolean;
    nfc: boolean;
    fingerprint?: string;
  };
  display: {
    protection: string;
    type: string;
    size: number;
    resolution: string;
  };
  platform: {
    chipset: string;
    cpu: string;
    antutu_score: number;
    os: string;
    gpu: string;
  };
  camera: {
    features: string;
    main_mp: number;
    setup: string;
    video: string;
    selfie_mp: number;
  };
  warranty?: {
    duration_months: number;
    provider: string;
  };
  expert_verdict?: {
    verdict: string;
    pros: string[];
    cons: string[];
  };
  competitor_ids?: string[];
  images?: string[];
  color_variants?: {
    name: string;
    images: string[];
  }[];
  banners?: string[];
  retailers?: Retailer[];
}

import { getPhones } from "@/lib/phones";
import { type Phone } from "@/types";
import { HomeClient } from "@/components/home/HomeClient";
import { Banner } from "@/components/shared/Banner";

export default async function Home() {
  const phones = await getPhones();
  
  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <div className="view-container pt-3">
        <Banner placement="HERO" className="mb-3" />
      </div>
      <HomeClient initialPhones={phones} />
    </div>
  );
}


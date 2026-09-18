import fs from "fs";
import path from "path";
import { type Phone } from "@/types";
import { HomeClient } from "@/components/home/HomeClient";

// We read the JSON file on the server in a React Server Component.
// This is incredibly fast and avoids passing 6MB over the wire as a JSON download,
// although Next.js will inline it as a prop.
async function getPhones(): Promise<Phone[]> {
  const filePath = path.join(process.cwd(), "public", "data", "phones.json");
  const fileContents = fs.readFileSync(filePath, "utf8");
  return JSON.parse(fileContents);
}

export default async function Home() {
  const phones = await getPhones();
  
  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <HomeClient initialPhones={phones} />
    </div>
  );
}

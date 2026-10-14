/**
 * Push Apple phone specs from phones.json into Supabase (update existing rows).
 * Usage: node --env-file=.env.local scripts/push-apple-specs-to-db.mjs
 */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

const __dirname = dirname(fileURLToPath(import.meta.url));
const phones = JSON.parse(
  readFileSync(join(__dirname, "..", "public", "data", "phones.json"), "utf8")
);
const apples = phones.filter((p) => p.brand === "Apple");
const prisma = new PrismaClient();

let ok = 0;
let miss = 0;

try {
  console.log(`Updating ${apples.length} Apple phones in DB...`);
  for (const p of apples) {
    const res = await prisma.phone.updateMany({
      where: { OR: [{ slug: p.slug }, { legacyId: p.id || p.slug }] },
      data: {
        model: p.model,
        display: p.display ?? {},
        platform: p.platform ?? {},
        memory: p.memory ?? {},
        battery: p.battery ?? {},
        camera: p.camera ?? {},
        connectivity: p.connectivity ?? {},
        detailedSpecs: p.detailed_specs ?? {},
      },
    });
    if (res.count > 0) {
      ok++;
      console.log(`OK  ${p.slug}`);
    } else {
      miss++;
      console.log(`MISS ${p.slug}`);
    }
  }
  console.log(`\nDone. updated=${ok} missing=${miss}`);
} finally {
  await prisma.$disconnect();
}

import { PrismaClient, Role } from "@prisma/client";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import argon2 from "argon2";

// Ensure .env.local variables are loaded if invoked standalone
if (!process.env.DATABASE_URL) {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

const prisma = new PrismaClient();


function generateSecurePassword(length = 16): string {
  // Generates a cryptographically strong random password
  const bytes = crypto.randomBytes(length);
  const base = bytes.toString("base64url").slice(0, length);
  // Guarantee symbols and numbers are present
  return `${base}!A9`;
}

async function main() {
  console.log("--------------------------------------------------");
  console.log("  Running CompareIt.pk Database Seed...");
  console.log("--------------------------------------------------");

  const email = "admin@compareit.pk";
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  const shouldReset = process.argv.includes("--reset");

  if (existingUser && !shouldReset) {
    console.log(`[SEED] Admin account (${email}) already exists in database.`);
    console.log(`[SEED] To regenerate password, run: npx tsx prisma/seed.ts --reset`);
    return;
  }

  // Generate strong random password (never hardcoded in repo)
  const plainPassword = generateSecurePassword(18);
  const passwordHash = await argon2.hash(plainPassword);

  if (existingUser && shouldReset) {
    await prisma.user.update({
      where: { email },
      data: {
        passwordHash,
        role: Role.ADMIN,
        mustChangePassword: true,
      },
    });
    console.log("\n==================================================");
    console.log("  ADMIN PASSWORD RESET SUCCESSFULLY");
    console.log("==================================================");
  } else {
    await prisma.user.create({
      data: {
        email,
        name: "CompareIt Admin",
        passwordHash,
        role: Role.ADMIN,
        mustChangePassword: true,
      },
    });
    console.log("\n==================================================");
    console.log("  ADMIN ACCOUNT SEEDED SUCCESSFULLY");
    console.log("==================================================");
  }

  console.log(`  Email:                 ${email}`);
  console.log(`  Generated Password:    ${plainPassword}`);
  console.log(`  Role:                  ADMIN`);
  console.log(`  Must Change Password:  true`);
  console.log("==================================================");
  console.log("  NOTICE: Save this password now! It is printed");
  console.log("  ONCE in this terminal and is never stored in");
  console.log("  plain text or committed to the repository.");
  console.log("==================================================\n");
}

main()
  .catch((e) => {
    console.error("[SEED ERROR]", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

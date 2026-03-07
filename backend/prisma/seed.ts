import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

interface RequirementItem {
  id: string;
  title: string;
  level: string;
  cwe?: string;
  nist?: string;
  description: string;
  area: string;
}

interface Category {
  id: number;
  key: string;
  name: string;
  icon: string;
  chapter: string;
  requirements: RequirementItem[];
}

interface OwaspJSON {
  categories: Category[];
  version: string;
}

function parseLevelToInt(level: string): number {
  switch (level) {
    case "L1": return 1;
    case "L2": return 2;
    case "L3": return 3;
    default: return 1;
  }
}

async function main() {
  console.log("🌱 Starting database seed...");

  const jsonPath = path.join(__dirname, "../../data/owasp_asvs.json");

  if (!fs.existsSync(jsonPath)) {
    console.error("❌ File not found:", jsonPath);
    process.exit(1);
  }

  const jsonData: OwaspJSON = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  console.log(`📄 Loaded ${jsonData.categories.length} categories from JSON`);

  // Créer un utilisateur admin par défaut si aucun n'existe
  const adminExists = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (!adminExists) {
    console.log("👤 Creating default admin user...");
    await prisma.user.create({
      data: {
        email: "admin@owasp.local",
        password: "$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
        role: "ADMIN",
        firstName: "Admin",
        lastName: "User",
      },
    });
    console.log("   Email: admin@owasp.local");
    console.log("   Password: password (CHANGE THIS!)");
  }

  let imported = 0;
  let errors = 0;
  let total = 0;

  for (const category of jsonData.categories) {
    total += category.requirements.length;
  }
  console.log(`📊 Total requirements to import: ${total}`);

  for (const category of jsonData.categories) {
    console.log(`\n📁 ${category.icon} ${category.name} (${category.requirements.length} requirements)`);

    for (const req of category.requirements) {
      try {
        const cweValue = req.cwe ? req.cwe.replace("CWE-", "") : null;

        await prisma.requirement.upsert({
          where: { owaspId: req.id },
          update: {
            area: req.area,
            asvsLevel: parseLevelToInt(req.level),
            cwe: cweValue,
            nist: req.nist || null,
            description: req.description,
          },
          create: {
            owaspId: req.id,
            area: req.area,
            asvsLevel: parseLevelToInt(req.level),
            cwe: cweValue,
            nist: req.nist || null,
            description: req.description,
          },
        });

        imported++;
        process.stdout.write(`\r   Progress: ${imported}/${total}`);
      } catch (error) {
        console.error(`\n❌ Error importing ${req.id}:`, (error as Error).message);
        errors++;
      }
    }
  }

  console.log(`\n\n✅ Seed completed!`);
  console.log(`   Imported: ${imported}`);
  console.log(`   Errors:   ${errors}`);
  console.log(`   Categories: ${jsonData.categories.length}`);
}

main()
  .catch((e) => {
    console.error("Fatal error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
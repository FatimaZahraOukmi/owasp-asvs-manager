import { Request, Response } from "express";
import {
  PrismaClient,
  Status,
  AdminDecision,
  AuditAction,
} from "@prisma/client";
import Groq from "groq-sdk";
import simpleGit from "simple-git";
import * as fs from "fs-extra";
import * as path from "path";
import * as os from "os";

const prisma = new PrismaClient();

const CODE_EXTENSIONS = [
  ".ts",
  ".js",
  ".py",
  ".java",
  ".php",
  ".cs",
  ".go",
  ".rb",
  ".tsx",
  ".jsx",
  ".vue",
  ".env",
  ".json",
  ".yaml",
  ".yml",
  ".xml",
];
const IGNORE_DIRS = [
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
  ".next",
  "vendor",
  "__pycache__",
  ".cache",
  "target",
];
const PRIORITY_KEYWORDS = [
  "auth",
  "login",
  "register",
  "password",
  "token",
  "jwt",
  "session",
  "middleware",
  "guard",
  "security",
  "crypto",
  "hash",
  "encrypt",
  "config",
  "cors",
  "helmet",
  "rate",
  "limit",
  "validation",
  "sanitize",
  "csrf",
  "xss",
  "sql",
  "inject",
];

function isPriorityFile(filePath: string): boolean {
  return PRIORITY_KEYWORDS.some((kw) => filePath.toLowerCase().includes(kw));
}

function getCodeFiles(dir: string, files: string[] = [], depth = 0): string[] {
  if (depth > 6) return files;
  try {
    for (const entry of fs.readdirSync(dir)) {
      if (IGNORE_DIRS.includes(entry)) continue;
      const fullPath = path.join(dir, entry);
      if (fs.statSync(fullPath).isDirectory())
        getCodeFiles(fullPath, files, depth + 1);
      else if (CODE_EXTENSIONS.includes(path.extname(entry).toLowerCase()))
        files.push(fullPath);
    }
  } catch {}
  return files;
}

function readCodeContent(
  files: string[],
  repoDir: string,
  maxChars = 50000,
): string {
  const sorted = files.sort(
    (a, b) => (isPriorityFile(a) ? 0 : 1) - (isPriorityFile(b) ? 0 : 1),
  );
  let content = "";
  for (const file of sorted) {
    if (content.length >= maxChars) break;
    try {
      const relativePath = path.relative(repoDir, file);
      const snippet = fs.readFileSync(file, "utf-8").slice(0, 2000);
      content += `\n\n=== FILE: ${relativePath} ===\n${snippet}`;
    } catch {}
  }
  return content.slice(0, maxChars);
}

export const analyzeGithub = async (req: Request, res: Response) => {
  const tempDir = path.join(os.tmpdir(), `owasp-clone-${Date.now()}`);
  try {
    const { id: projectId } = req.params;
    // @ts-ignore
    const userId = req.user?.userId;
    const { githubUrl } = req.body;

    if (!githubUrl)
      return res
        .status(400)
        .json({ success: false, message: "URL GitHub manquante" });

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project)
      return res
        .status(404)
        .json({ success: false, message: "Projet introuvable" });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey)
      return res
        .status(500)
        .json({ success: false, message: "GROQ_API_KEY non configurée" });

    // 1. Cloner
    console.log(`[GitHub Analysis] Cloning ${githubUrl}...`);
    await fs.ensureDir(tempDir);
    await simpleGit().clone(githubUrl, tempDir, ["--depth", "1"]);

    // 2. Lire les fichiers
    const allFiles = getCodeFiles(tempDir);
    const codeContent = readCodeContent(allFiles, tempDir);
    console.log(
      `[GitHub Analysis] ${allFiles.length} files, ${codeContent.length} chars`,
    );

    // 3. Requirements
    const requirements = await prisma.requirement.findMany({
      orderBy: { owaspId: "asc" },
    });
    const owaspIdMap = new Map(requirements.map((r) => [r.owaspId, r]));

    // 4. Initialiser checklist
    const existingPRs = await prisma.projectRequirement.findMany({
      where: { projectId },
      select: { requirementId: true },
    });
    const existingIds = new Set(existingPRs.map((e) => e.requirementId));
    const toCreate = requirements.filter((r) => !existingIds.has(r.id));
    if (toCreate.length > 0) {
      await prisma.projectRequirement.createMany({
        data: toCreate.map((r) => ({
          projectId,
          requirementId: r.id,
          status: Status.NOT_DONE,
          adminDecision: AdminDecision.YES,
        })),
      });
    }

    // 5. Groq client
    const groq = new Groq({ apiKey });

    const BATCH_SIZE = 50;
    let totalUpdated = 0;
    const results: {
      owaspId: string;
      status: Status;
      justification: string;
    }[] = [];

    for (let i = 0; i < requirements.length; i += BATCH_SIZE) {
      const batch = requirements.slice(i, i + BATCH_SIZE);
      console.log(
        `[GitHub Analysis] Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(requirements.length / BATCH_SIZE)}`,
      );

      const reqList = batch
        .map(
          (r) =>
            `- owaspId: "${r.owaspId}" | L${r.asvsLevel} | ${r.area}\n  ${r.description}`,
        )
        .join("\n");

      const prompt = `Tu es un expert OWASP ASVS. Analyse ce code source et évalue chaque requirement.

CODE SOURCE:
${codeContent.slice(0, 30000)}

REQUIREMENTS À ÉVALUER:
${reqList}

RÈGLES:
- DONE: clairement implémenté dans le code
- IN_PROGRESS: partiellement implémenté
- NOT_DONE: absent ou non implémenté
- Réponds UNIQUEMENT en JSON valide, sans markdown, sans backticks

Format EXACT:
{"results":[{"owaspId":"1.1.1","status":"DONE","justification":"explication courte en français"}]}`;

      try {
        const completion = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
          max_tokens: 4000,
        });

        const text = completion.choices[0]?.message?.content?.trim() || "";
        let parsed: any;
        try {
          const clean = text
            .replace(/```json\n?/g, "")
            .replace(/```\n?/g, "")
            .trim();
          parsed = JSON.parse(clean);
        } catch {
          const match = text.match(/\{[\s\S]*\}/);
          if (match) parsed = JSON.parse(match[0]);
          else {
            console.error("Cannot parse:", text.slice(0, 200));
            continue;
          }
        }

        if (parsed?.results && Array.isArray(parsed.results)) {
          for (const item of parsed.results) {
            if (!item.owaspId || !item.status) continue;
            if (!["DONE", "NOT_DONE", "IN_PROGRESS"].includes(item.status))
              continue;
            results.push({
              owaspId: item.owaspId,
              status: item.status as Status,
              justification: item.justification || "",
            });
          }
        }
      } catch (err: any) {
        console.error(`Batch ${i} error:`, err.message?.slice(0, 100));
      }

      if (i + BATCH_SIZE < requirements.length) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    // 6. Sauvegarder
    console.log(`[GitHub Analysis] Saving ${results.length} results...`);
    for (const item of results) {
      const req = owaspIdMap.get(item.owaspId);
      if (!req) continue;
      try {
        const pr = await prisma.projectRequirement.upsert({
          where: {
            projectId_requirementId: { projectId, requirementId: req.id },
          },
          update: {
            status: item.status,
            comment: item.justification
              ? `[IA Groq] ${item.justification}`
              : undefined,
            updatedById: userId,
          },
          create: {
            projectId,
            requirementId: req.id,
            status: item.status,
            adminDecision: AdminDecision.YES,
            comment: item.justification
              ? `[IA Groq] ${item.justification}`
              : null,
            updatedById: userId,
          },
        });
        if (userId) {
          await prisma.auditLog.create({
            data: {
              action: AuditAction.AI_ANALYSIS,
              oldValue: null,
              newValue: item.status,
              projectRequirementId: pr.id,
              userId,
            },
          });
        }
        totalUpdated++;
      } catch (err) {
        console.error(`Error saving ${item.owaspId}:`, err);
      }
    }

    await fs.remove(tempDir);
    console.log(`[GitHub Analysis] Done! ${totalUpdated} updated`);

    res.json({
      success: true,
      message: `Analyse terminée — ${totalUpdated} requirements mis à jour`,
      data: {
        filesAnalyzed: allFiles.length,
        requirementsAnalyzed: results.length,
        updated: totalUpdated,
      },
    });
  } catch (error) {
    try {
      await fs.remove(tempDir);
    } catch {}
    console.error("[GitHub Analysis] Error:", error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import Groq from "groq-sdk";

const prisma = new PrismaClient();

export const getRequirements = async (req: Request, res: Response) => {
  try {
    const { level, area, search } = req.query;
    const where: any = {};
    if (level) where.asvsLevel = parseInt(level as string);
    if (area) where.area = { contains: area as string };
    if (search) {
      where.OR = [
        { description: { contains: search as string } },
        { owaspId: { contains: search as string } },
      ];
    }
    const requirements = await prisma.requirement.findMany({
      where,
      orderBy: { owaspId: "asc" },
    });
    res.json({ success: true, data: requirements });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getRequirementById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const requirement = await prisma.requirement.findUnique({ where: { id } });
    if (!requirement)
      return res
        .status(404)
        .json({ success: false, message: "Requirement introuvable" });
    res.json({ success: true, data: requirement });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const generateCode = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const requirement = await prisma.requirement.findUnique({ where: { id } });
    if (!requirement)
      return res
        .status(404)
        .json({ success: false, message: "Requirement introuvable" });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey)
      return res
        .status(500)
        .json({ success: false, message: "GROQ_API_KEY non configurée" });

    const groq = new Groq({ apiKey });

    const prompt = `Tu es un expert en sécurité applicative OWASP.

Génère une implémentation concrète du requirement OWASP ASVS suivant :

ID: ${requirement.owaspId}
Domaine: ${requirement.area}
Niveau: L${requirement.asvsLevel}
CWE: ${requirement.cwe || "N/A"}
Description: ${requirement.description}

INSTRUCTIONS:
- Génère du code FONCTIONNEL pour chaque langage
- Le code doit implémenter ce requirement de sécurité
- Inclus les imports nécessaires
- Ajoute des commentaires en français
- Réponds UNIQUEMENT en JSON valide sans markdown ni backticks

Format JSON exact:
{"explanation":"Explication courte en français","java":"// Code Java","python":"# Code Python","nodejs":"// Code Node.js"}`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 3000,
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
      else throw new Error("Impossible de parser la réponse");
    }

    res.json({
      success: true,
      data: {
        explanation: parsed.explanation || "",
        java: parsed.java || "// Code non disponible",
        python: parsed.python || "# Code non disponible",
        nodejs: parsed.nodejs || "// Code non disponible",
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

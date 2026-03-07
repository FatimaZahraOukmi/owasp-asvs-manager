import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import Groq from "groq-sdk";

const prisma = new PrismaClient();

const SYSTEM_PROMPT = `Tu es un expert en sécurité applicative OWASP ASVS (Application Security Verification Standard).
Tu aides les développeurs et auditeurs à comprendre et implémenter les requirements de sécurité OWASP.

Tes capacités :
- Expliquer les requirements OWASP ASVS en français
- Donner des conseils d'implémentation concrets (Java, Python, Node.js)
- Expliquer les vulnérabilités CWE associées
- Recommander des bonnes pratiques de sécurité
- Analyser des problèmes de sécurité et proposer des solutions

Règles :
- Réponds TOUJOURS en français
- Sois précis, concret et pratique
- Si tu donnes du code, il doit être fonctionnel
- Cite les références OWASP quand c'est pertinent
- Sois concis mais complet`;

export const getConversations = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const conversations = await prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 20,
      include: {
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
    res.json({ success: true, data: conversations });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const createConversation = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { title, projectId } = req.body;
    const conversation = await prisma.conversation.create({
      data: {
        title: title || "Nouvelle conversation",
        userId,
        projectId: projectId || null,
      },
    });
    res.json({ success: true, data: conversation });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;
    const conversation = await prisma.conversation.findFirst({
      where: { id, userId },
    });
    if (!conversation)
      return res
        .status(404)
        .json({ success: false, message: "Conversation introuvable" });

    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" },
    });
    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;
    const { content, requirementId } = req.body;

    if (!content?.trim())
      return res.status(400).json({ success: false, message: "Message vide" });

    // Vérifier que la conversation appartient à l'user
    const conversation = await prisma.conversation.findFirst({
      where: { id, userId },
    });
    if (!conversation)
      return res
        .status(404)
        .json({ success: false, message: "Conversation introuvable" });

    // Sauvegarder le message user
    await prisma.message.create({
      data: {
        conversationId: id,
        senderId: userId,
        role: "USER",
        content: content.trim(),
        requirementId: requirementId || null,
      },
    });

    // Récupérer l'historique pour le contexte
    const history = await prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" },
      take: 20,
    });

    // Contexte optionnel : requirement lié
    let contextExtra = "";
    if (requirementId) {
      const req2 = await prisma.requirement.findUnique({
        where: { id: requirementId },
      });
      if (req2) {
        contextExtra = `\n\nContexte - Requirement OWASP ${req2.owaspId} (${req2.area}, L${req2.asvsLevel}) : ${req2.description}`;
      }
    }

    // Construire les messages pour Groq
    const groqMessages: any[] = [
      { role: "system", content: SYSTEM_PROMPT + contextExtra },
      ...history.slice(0, -1).map((m) => ({
        role: m.role === "USER" ? "user" : "assistant",
        content: m.content,
      })),
      { role: "user", content: content.trim() },
    ];

    // Appel Groq
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey)
      return res
        .status(500)
        .json({ success: false, message: "GROQ_API_KEY non configurée" });

    const groq = new Groq({ apiKey });
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: groqMessages,
      temperature: 0.7,
      max_tokens: 1500,
    });

    const aiResponse =
      completion.choices[0]?.message?.content?.trim() ||
      "Désolé, je n'ai pas pu générer une réponse.";
    const tokensUsed = completion.usage?.total_tokens || 0;

    // Sauvegarder réponse IA
    const aiMessage = await prisma.message.create({
      data: {
        conversationId: id,
        senderId: userId,
        role: "ASSISTANT",
        content: aiResponse,
        tokensUsed,
      },
    });

    // Mettre à jour le titre si c'est le premier échange
    if (history.length <= 1) {
      const shortTitle =
        content.trim().substring(0, 50) + (content.length > 50 ? "..." : "");
      await prisma.conversation.update({
        where: { id },
        data: { title: shortTitle, updatedAt: new Date() },
      });
    } else {
      await prisma.conversation.update({
        where: { id },
        data: { updatedAt: new Date() },
      });
    }

    // Log IA
    await prisma.aIRequestLog.create({
      data: {
        userId,
        prompt: content.trim(),
        response: aiResponse,
        tokensUsed,
        model: "llama-3.3-70b-versatile",
        requirementId: requirementId || null,
      },
    });

    res.json({ success: true, data: aiMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const deleteConversation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;
    const conversation = await prisma.conversation.findFirst({
      where: { id, userId },
    });
    if (!conversation)
      return res
        .status(404)
        .json({ success: false, message: "Conversation introuvable" });

    await prisma.conversation.delete({ where: { id } });
    res.json({ success: true, message: "Conversation supprimée" });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

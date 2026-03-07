import { Request, Response } from "express";
import {
  PrismaClient,
  Status,
  AdminDecision,
  AuditAction,
} from "@prisma/client";

const prisma = new PrismaClient();

// GET /projects/:id/checklist
export const getChecklist = async (req: Request, res: Response) => {
  try {
    const { id: projectId } = req.params;
    const { level, area } = req.query;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Projet introuvable" });
    }

    const whereRequirement: any = {};
    if (level) whereRequirement.asvsLevel = parseInt(level as string);
    if (area) whereRequirement.area = { contains: area as string };

    const requirements = await prisma.requirement.findMany({
      where: whereRequirement,
      orderBy: { owaspId: "asc" },
    });

    const projectRequirements = await prisma.projectRequirement.findMany({
      where: { projectId },
    });

    const prMap = new Map(
      projectRequirements.map((pr) => [pr.requirementId, pr]),
    );

    const checklist = requirements.map((req) => {
      const pr = prMap.get(req.id);
      return {
        requirementId: req.id,
        owaspId: req.owaspId,
        area: req.area,
        asvsLevel: req.asvsLevel,
        cwe: req.cwe,
        description: req.description,
        projectRequirementId: pr?.id || null,
        status: pr?.status || null,
        adminDecision: pr?.adminDecision || null,
        comment: pr?.comment || null,
        sourceCodeReference: pr?.sourceCodeReference || null,
        toolUsed: pr?.toolUsed || null,
      };
    });

    const total = checklist.length;
    const done = checklist.filter((r) => r.status === Status.DONE).length;
    const inProgress = checklist.filter(
      (r) => r.status === Status.IN_PROGRESS,
    ).length;
    const notDone = checklist.filter(
      (r) => r.status === Status.NOT_DONE,
    ).length;
    const notApplicable = checklist.filter(
      (r) => r.status === Status.NOT_APPLICABLE,
    ).length;
    const notStarted = checklist.filter((r) => r.status === null).length;
    const score =
      total > 0 ? Math.round((done / (total - notApplicable)) * 100) : 0;

    res.json({
      success: true,
      data: {
        project,
        checklist,
        stats: {
          total,
          done,
          inProgress,
          notDone,
          notApplicable,
          notStarted,
          score,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// POST /projects/:id/checklist/init
export const initChecklist = async (req: Request, res: Response) => {
  try {
    const { id: projectId } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Projet introuvable" });
    }

    const requirements = await prisma.requirement.findMany();
    const existing = await prisma.projectRequirement.findMany({
      where: { projectId },
      select: { requirementId: true },
    });

    const existingIds = new Set(existing.map((e) => e.requirementId));
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

    res.json({
      success: true,
      message: `${toCreate.length} requirements initialisés`,
      created: toCreate.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// PATCH /projects/:id/checklist/:requirementId
export const updateRequirementStatus = async (req: Request, res: Response) => {
  try {
    const { id: projectId, requirementId } = req.params;
    // @ts-ignore
    const userId = req.user?.userId;
    const { status, adminDecision, comment, sourceCodeReference, toolUsed } =
      req.body;

    // Récupérer l'ancienne valeur pour l'audit log
    const existing = await prisma.projectRequirement.findUnique({
      where: { projectId_requirementId: { projectId, requirementId } },
    });

    // Upsert
    const pr = await prisma.projectRequirement.upsert({
      where: { projectId_requirementId: { projectId, requirementId } },
      update: {
        ...(status && { status: status as Status }),
        ...(adminDecision && { adminDecision: adminDecision as AdminDecision }),
        ...(comment !== undefined && { comment }),
        ...(sourceCodeReference !== undefined && { sourceCodeReference }),
        ...(toolUsed !== undefined && { toolUsed }),
        updatedById: userId,
      },
      create: {
        projectId,
        requirementId,
        status: (status as Status) || Status.NOT_DONE,
        adminDecision: (adminDecision as AdminDecision) || AdminDecision.YES,
        comment: comment || null,
        sourceCodeReference: sourceCodeReference || null,
        toolUsed: toolUsed || null,
        updatedById: userId,
      },
    });

    // Créer l'audit log selon ce qui a changé
    if (userId) {
      let action: AuditAction | null = null;
      let oldValue: string | null = null;
      let newValue: string | null = null;

      if (status && status !== existing?.status) {
        action = AuditAction.STATUS_CHANGE;
        oldValue = existing?.status || null;
        newValue = status;
      } else if (comment !== undefined && comment !== existing?.comment) {
        action = AuditAction.COMMENT_UPDATE;
        oldValue = existing?.comment || null;
        newValue = comment || null;
      } else if (
        sourceCodeReference !== undefined &&
        sourceCodeReference !== existing?.sourceCodeReference
      ) {
        action = AuditAction.SOURCE_REF_UPDATE;
        oldValue = existing?.sourceCodeReference || null;
        newValue = sourceCodeReference || null;
      } else if (toolUsed !== undefined && toolUsed !== existing?.toolUsed) {
        action = AuditAction.TOOL_UPDATE;
        oldValue = existing?.toolUsed || null;
        newValue = toolUsed || null;
      } else if (adminDecision && adminDecision !== existing?.adminDecision) {
        action = AuditAction.ADMIN_DECISION_CHANGE;
        oldValue = existing?.adminDecision || null;
        newValue = adminDecision;
      }

      if (action) {
        await prisma.auditLog.create({
          data: {
            action,
            oldValue,
            newValue,
            projectRequirementId: pr.id,
            userId,
          },
        });
      }
    }

    res.json({ success: true, data: pr });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

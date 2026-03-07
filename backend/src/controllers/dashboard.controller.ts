import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const { userId, role } = req.user;

    if (role === "ADMIN") {
      const [totalProjects, totalUsers, totalRequirements, allRequirements] =
        await Promise.all([
          prisma.project.count({ where: { isActive: true } }),
          prisma.user.count({ where: { isActive: true } }),
          prisma.requirement.count(),
          prisma.requirement.findMany({
            select: { asvsLevel: true, area: true },
          }),
        ]);

      const projectRequirements = await prisma.projectRequirement.findMany({
        select: { status: true },
      });
      const done = projectRequirements.filter(
        (r) => r.status === "DONE",
      ).length;
      const inProgress = projectRequirements.filter(
        (r) => r.status === "IN_PROGRESS",
      ).length;
      const notDone = projectRequirements.filter(
        (r) => r.status === "NOT_DONE",
      ).length;
      const notApplicable = projectRequirements.filter(
        (r) => r.status === "NOT_APPLICABLE",
      ).length;
      const total = projectRequirements.length;
      const avgScore = total > 0 ? Math.round((done / total) * 100) : 0;

      const byLevel = {
        L1: allRequirements.filter((r) => r.asvsLevel === 1).length,
        L2: allRequirements.filter((r) => r.asvsLevel === 2).length,
        L3: allRequirements.filter((r) => r.asvsLevel === 3).length,
      };

      const prWithArea = await prisma.projectRequirement.findMany({
        select: { status: true, requirement: { select: { area: true } } },
      });
      const areaCounts: Record<string, { total: number; done: number }> = {};
      prWithArea.forEach((pr) => {
        const area = pr.requirement.area;
        if (!areaCounts[area]) areaCounts[area] = { total: 0, done: 0 };
        areaCounts[area].total++;
        if (pr.status === "DONE") areaCounts[area].done++;
      });
      const byCategory = Object.entries(areaCounts)
        .map(([area, c]) => ({
          area,
          total: c.total,
          done: c.done,
          score: c.total > 0 ? Math.round((c.done / c.total) * 100) : 0,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 8);

      const recentProjects = await prisma.project.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          createdBy: {
            select: { firstName: true, lastName: true, email: true },
          },
          projectRequirements: { select: { status: true } },
        },
      });
      const recentProjectsWithScore = recentProjects.map((p) => {
        const pDone = p.projectRequirements.filter(
          (r) => r.status === "DONE",
        ).length;
        const pTotal = p.projectRequirements.length;
        const pNA = p.projectRequirements.filter(
          (r) => r.status === "NOT_APPLICABLE",
        ).length;
        const applicable = pTotal - pNA;
        return {
          id: p.id,
          name: p.name,
          createdAt: p.createdAt,
          createdBy: p.createdBy,
          total: pTotal,
          done: pDone,
          score: applicable > 0 ? Math.round((pDone / applicable) * 100) : 0,
        };
      });

      const recentActivity = await prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          projectRequirement: {
            include: {
              project: { select: { name: true } },
              requirement: { select: { owaspId: true } },
            },
          },
        },
      });

      // Notifications admin : tous les commentaires auditeur (7 derniers jours)
      const sevenDaysAgoAdmin = new Date();
      sevenDaysAgoAdmin.setDate(sevenDaysAgoAdmin.getDate() - 7);
      const adminNotifications = await prisma.auditLog.findMany({
        where: {
          action: "COMMENT_UPDATE",
          createdAt: { gte: sevenDaysAgoAdmin },
          user: { role: "AUDITOR" },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          projectRequirement: {
            include: {
              project: { select: { id: true, name: true } },
              requirement: { select: { owaspId: true, area: true } },
            },
          },
        },
      });

      return res.json({
        success: true,
        data: {
          role: "ADMIN",
          stats: {
            totalProjects,
            totalUsers,
            totalRequirements,
            avgScore,
            statusBreakdown: {
              done,
              inProgress,
              notDone,
              notApplicable,
              total,
            },
          },
          byLevel,
          byCategory,
          recentProjects: recentProjectsWithScore,
          recentActivity,
          notifications: adminNotifications,
        },
      });
    }

    if (role === "DEVELOPER" || role === "AUDITOR") {
      // ✅ 286 requirements OWASP réels, pas multiplié par le nombre de projets
      const totalRequirementsGlobal = await prisma.requirement.count();

      const projects = await prisma.project.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        include: {
          projectRequirements: {
            include: { requirement: { select: { asvsLevel: true } } },
          },
        },
      });

      const projectsWithScore = projects.map((p) => {
        const prs = p.projectRequirements as any[];
        const total = prs.length;
        const done = prs.filter((r) => r.status === "DONE").length;
        const inProgress = prs.filter((r) => r.status === "IN_PROGRESS").length;
        const notApplicable = prs.filter(
          (r) => r.status === "NOT_APPLICABLE",
        ).length;
        const applicable = total - notApplicable;
        const score =
          applicable > 0 ? Math.round((done / applicable) * 100) : 0;

        const l1 = prs.filter((r) => r.requirement?.asvsLevel === 1);
        const l2 = prs.filter((r) => r.requirement?.asvsLevel <= 2);
        const l1Score =
          l1.length > 0
            ? Math.round(
                (l1.filter((r) => r.status === "DONE").length / l1.length) *
                  100,
              )
            : 0;
        const l2Score =
          l2.length > 0
            ? Math.round(
                (l2.filter((r) => r.status === "DONE").length / l2.length) *
                  100,
              )
            : 0;

        return {
          id: p.id,
          name: p.name,
          description: p.description,
          createdAt: p.createdAt,
          total,
          done,
          inProgress,
          notApplicable,
          score,
          l1Score,
          l2Score,
        };
      });

      const totalDone = projectsWithScore.reduce((acc, p) => acc + p.done, 0);
      const totalInProgress = projectsWithScore.reduce(
        (acc, p) => acc + p.inProgress,
        0,
      );
      const totalNA = projectsWithScore.reduce(
        (acc, p) => acc + p.notApplicable,
        0,
      );
      const avgScore =
        projectsWithScore.length > 0
          ? Math.round(
              projectsWithScore.reduce((acc, p) => acc + p.score, 0) /
                projectsWithScore.length,
            )
          : 0;

      // Activités récentes sur tous les projets
      const projectIds = projects.map((p) => p.id);
      const recentActivity = await prisma.auditLog.findMany({
        where: {
          projectRequirement: { projectId: { in: projectIds } },
        },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          projectRequirement: {
            include: {
              project: { select: { id: true, name: true } },
              requirement: { select: { owaspId: true } },
            },
          },
        },
      });

      // Notifications : commentaires auditeur sur les projets (7 derniers jours)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const notifications = await prisma.auditLog.findMany({
        where: {
          action: "COMMENT_UPDATE",
          createdAt: { gte: sevenDaysAgo },
          user: { role: "AUDITOR" },
          projectRequirement: { projectId: { in: projectIds } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          projectRequirement: {
            include: {
              project: { select: { id: true, name: true } },
              requirement: { select: { owaspId: true, area: true } },
            },
          },
        },
      });

      return res.json({
        success: true,
        data: {
          role,
          projects: projectsWithScore,
          stats: {
            totalProjects: projects.length,
            totalRequirements: totalRequirementsGlobal,
            totalDone,
            totalInProgress,
            totalNA,
            avgScore,
          },
          notifications,
          recentActivity,
        },
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

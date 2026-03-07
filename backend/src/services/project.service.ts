import { PrismaClient, Project, UserRole } from "@prisma/client";
import { AppError } from "../middleware/error.handler";

export class ProjectService {
  constructor(private prisma: PrismaClient) {}

  async createProject(
    name: string,
    description: string | undefined,
    userId: string,
  ): Promise<Project> {
    return this.prisma.project.create({
      data: {
        name,
        description,
        createdById: userId,
      },
    });
  }

  async getProjects(userId: string, userRole: UserRole): Promise<Project[]> {
    // Admin voit tous les projets, les autres voient seulement les leurs
    if (userRole === UserRole.ADMIN) {
      return this.prisma.project.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
      });
    }

    return this.prisma.project.findMany({
  where: { isActive: true },
  orderBy: { createdAt: "desc" },
});
  }

  async getProjectById(
    projectId: string,
  ): Promise<Project & { projectRequirements: any[] }> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        projectRequirements: {
          include: {
            requirement: true,
            updatedBy: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { requirement: { owaspId: "asc" } },
        },
      },
    });

    if (!project) {
      throw new AppError(404, "PROJECT_NOT_FOUND", "Projet non trouvé");
    }

    return project as any;
  }

  async deleteProject(
    projectId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new AppError(404, "PROJECT_NOT_FOUND", "Projet non trouvé");
    }

    // Seul l'admin ou le créateur peut supprimer
    if (userRole !== UserRole.ADMIN && project.createdById !== userId) {
      throw new AppError(
        403,
        "FORBIDDEN",
        "Vous ne pouvez pas supprimer ce projet",
      );
    }

    // Soft delete
    await this.prisma.project.update({
      where: { id: projectId },
      data: { isActive: false },
    });
    
  }
  async update(id: string, data: { name: string; description?: string }) {
  return this.prisma.project.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      updatedAt: new Date(),
    },
  });
}
}

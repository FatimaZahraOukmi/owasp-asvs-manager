import { Request, Response, NextFunction } from "express";
import { ProjectService } from "../services/project.service";
import { prisma } from "../config/database";
import { UserRole } from "@prisma/client";

const projectService = new ProjectService(prisma);

export class ProjectController {
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, description } = req.body;
      // @ts-ignore
      const userId = req.user?.userId;

      const project = await projectService.createProject(
        name,
        description,
        userId as string,
      );

      res.status(201).json({
        success: true,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  };

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // @ts-ignore
      const { userId, role } = req.user;

      const projects = await projectService.getProjects(
        userId,
        role as UserRole,
      );

      res.json({
        success: true,
        data: projects,
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const project = await projectService.getProjectById(id);

      res.json({
        success: true,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      // @ts-ignore
      const { userId, role } = req.user;

      await projectService.deleteProject(id, userId, role as UserRole);

      res.json({
        success: true,
        message: "Projet supprimé avec succès",
      });
    } catch (error) {
      next(error);
    }
  };
  update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const project = await projectService.update(id, { name, description });
    res.json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};
}

export default ProjectController;

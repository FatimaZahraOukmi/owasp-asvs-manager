import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { prisma } from "../config/database";
import { UserRole } from "@prisma/client";

const authService = new AuthService(prisma);

export class AuthController {
  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, role } = req.body;

      const user = await authService.register(
        email,
        password,
        role as UserRole,
      );

      res.status(201).json({
        success: true,
        message: "Utilisateur créé avec succès",
        data: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      const { user, token } = await authService.login(email, password);

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
          },
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // @ts-ignore - user est ajouté par le middleware
      const userId = req.user?.userId;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true,
          lastLoginAt: true,
        },
      });

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default AuthController;

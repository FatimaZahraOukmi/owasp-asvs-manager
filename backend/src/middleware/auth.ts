import { Request, Response, NextFunction } from "express";
import { PrismaClient, UserRole } from "@prisma/client";
import { AuthService } from "../services/auth.service";
import { AppError } from "./error.handler";
import { prisma } from "../config/database";

const authService = new AuthService(prisma);

// Étendre l'interface Request
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new AppError(401, "NO_TOKEN", "Token manquant");
    }

    const token = authHeader.substring(7);
    const payload = authService.verifyToken(token);

    req.user = payload;
    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError(401, "UNAUTHORIZED", "Non authentifié"));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, "FORBIDDEN", "Accès interdit"));
    }

    next();
  };
};

export default { authenticate, authorize };

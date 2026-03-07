import { PrismaClient, User, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import env from "../config/env";
import { AppError } from "../middleware/error.handler";

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  async register(
    email: string,
    password: string,
    role: UserRole = UserRole.DEVELOPER,
  ): Promise<User> {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError(409, "EMAIL_EXISTS", "Cet email est déjà utilisé");
    }

    const hashedPassword = await bcrypt.hash(password, env.BCRYPT_ROUNDS);

    return this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
      },
    });
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ user: User; token: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !user.isActive) {
      throw new AppError(
        401,
        "INVALID_CREDENTIALS",
        "Email ou mot de passe incorrect",
      );
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new AppError(
        401,
        "INVALID_CREDENTIALS",
        "Email ou mot de passe incorrect",
      );
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // CORRECTION DÉFINITIVE
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    return { user, token };
  }
  verifyToken(token: string): {
    userId: string;
    email: string;
    role: UserRole;
  } {
    try {
      return jwt.verify(token, env.JWT_SECRET) as any;
    } catch {
      throw new AppError(401, "INVALID_TOKEN", "Token invalide ou expiré");
    }
  }
}

export default AuthService;

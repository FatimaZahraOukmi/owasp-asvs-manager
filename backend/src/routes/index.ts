import { Router } from "express";
import authRoutes from "./auth.routes";
import projectRoutes from "./project.routes";
import requirementRoutes from "./requirement.routes";
import projectRequirementRoutes from "./project-requirement.routes";
import dashboardRoutes from "./dashboard.routes";
import userRoutes from "./user.routes";
import githubAnalyzeRoutes from "./github-analyze.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/projects", projectRoutes);
router.use("/projects/:id/checklist", projectRequirementRoutes);
router.use("/projects/:id/analyze-github", githubAnalyzeRoutes);
router.use("/requirements", requirementRoutes);
router.use("/users", userRoutes);

export default router;

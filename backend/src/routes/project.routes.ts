import { Router } from "express";
import { ProjectController } from "../controllers/project.controller";
import { authenticate, authorize } from "../middleware/auth";
import { UserRole } from "@prisma/client";

const router = Router();
const controller = new ProjectController();

router.use(authenticate);

router.post("/", controller.create);
router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.delete("/:id", authorize(UserRole.ADMIN), controller.delete);
router.put("/:id", controller.update);

export default router;

import { Router } from "express";
import { authenticate } from "../middleware/auth";
import {
  getChecklist,
  initChecklist,
  updateRequirementStatus,
} from "../controllers/project-requirement.controller";

const router = Router({ mergeParams: true }); // mergeParams pour accéder à :id du parent

router.get("/", authenticate, getChecklist);
router.post("/init", authenticate, initChecklist);
router.patch("/:requirementId", authenticate, updateRequirementStatus);

export default router;
import { Router } from "express";
import { getRequirements, getRequirementById, generateCode } from "../controllers/requirement.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/", getRequirements);
router.get("/:id", getRequirementById);
router.post("/:id/generate-code", generateCode);

export default router;
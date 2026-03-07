import { Router } from "express";
import { analyzeGithub } from "../controllers/github-analyze.controller";
import { authenticate } from "../middleware/auth";

const router = Router({ mergeParams: true });

router.use(authenticate);
router.post("/", analyzeGithub);

export default router;

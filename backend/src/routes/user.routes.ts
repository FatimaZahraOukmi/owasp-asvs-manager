import { Router } from "express";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/user.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

// Toutes les routes users nécessitent auth + ADMIN
const adminOnly = (req: any, res: any, next: any) => {
  if (req.user?.role !== "ADMIN") {
    return res
      .status(403)
      .json({ success: false, message: "Accès réservé aux administrateurs" });
  }
  next();
};

router.use(authenticate);
router.use(adminOnly);

router.get("/", getUsers);
router.post("/", createUser);
router.patch("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;

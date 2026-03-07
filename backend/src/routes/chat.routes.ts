import { Router } from "express";
import {
  getConversations,
  createConversation,
  getMessages,
  sendMessage,
  deleteConversation,
} from "../controllers/chat.controller";
import { authenticate } from "../middleware/auth";

const router = Router();
router.use(authenticate);

router.get("/", getConversations);
router.post("/", createConversation);
router.get("/:id/messages", getMessages);
router.post("/:id/messages", sendMessage);
router.delete("/:id", deleteConversation);

export default router;

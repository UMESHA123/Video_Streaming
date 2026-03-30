import { Router } from "express";
import {
  getComments,
  addComment,
  deleteComment,
} from "../controllers/comment.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/:videoId", getComments);
router.post("/:videoId", authenticate, addComment);
router.delete("/:videoId/:commentId", authenticate, deleteComment);

export default router;

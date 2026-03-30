import { Router } from "express";
import {
  masterPlaylist,
  qualityPlaylist,
  segment,
} from "../controllers/stream.controller.js";

const router = Router();

router.get("/:videoId/master.m3u8", masterPlaylist);
router.get("/:videoId/:quality/playlist.m3u8", qualityPlaylist);
router.get("/:videoId/:quality/:segment", segment);

export default router;

import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import { createLogger } from "../utils/logger.js";

const log = createLogger("FFmpeg:Config");

export function configureFfmpeg(): void {
  const ffmpegPath = process.env.FFMPEG_PATH;
  const ffprobePath = process.env.FFPROBE_PATH;

  if (ffmpegPath) {
    if (!fs.existsSync(ffmpegPath)) {
      log.error(`FFmpeg binary not found at: ${ffmpegPath}`);
    } else {
      ffmpeg.setFfmpegPath(ffmpegPath);
      log.info(`FFmpeg path set to: ${ffmpegPath}`);
    }
  } else {
    log.warn("FFMPEG_PATH not set — relying on system PATH");
  }

  if (ffprobePath) {
    if (!fs.existsSync(ffprobePath)) {
      log.error(`FFprobe binary not found at: ${ffprobePath}`);
    } else {
      ffmpeg.setFfprobePath(ffprobePath);
      log.info(`FFprobe path set to: ${ffprobePath}`);
    }
  } else {
    log.warn("FFPROBE_PATH not set — relying on system PATH");
  }
}

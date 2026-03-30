import Bull from "bull";
import { transcodeToHLS, extractThumbnail } from "./ffmpeg.service.js";
import { readVideos, writeVideos } from "../db/db.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("Queue");

interface TranscodeJobData {
  videoId: string;
  inputPath: string;
}

let transcodeQueue: Bull.Queue<TranscodeJobData> | null = null;
let redisAvailable = false;

function updateVideoStatus(
  videoId: string,
  updates: Record<string, unknown>
): void {
  const videos = readVideos();
  const index = videos.findIndex((v) => v.id === videoId);
  if (index !== -1) {
    videos[index] = { ...videos[index], ...updates };
    writeVideos(videos);
  }
}

async function processTranscodeJob(
  videoId: string,
  inputPath: string
): Promise<void> {
  log.info(`Starting transcode job for video ${videoId}, input: ${inputPath}`);
  updateVideoStatus(videoId, { status: "processing" });

  try {
    // Extract thumbnail first (before original file may be removed)
    log.info(`[${videoId}] Step 1/2: Extracting thumbnail...`);
    const thumbnailUrl = await extractThumbnail(videoId, inputPath);
    updateVideoStatus(videoId, { thumbnailUrl });
    log.info(`[${videoId}] Thumbnail done: ${thumbnailUrl}`);

    // Transcode to HLS
    log.info(`[${videoId}] Step 2/2: Transcoding to HLS...`);
    const { duration, hlsUrl } = await transcodeToHLS(videoId, inputPath);

    updateVideoStatus(videoId, {
      status: "ready",
      duration,
      hlsUrl,
    });

    log.info(`[${videoId}] Transcode complete — duration: ${duration}s, hlsUrl: ${hlsUrl}`);
  } catch (err) {
    log.error(`[${videoId}] Transcode FAILED`, err);
    updateVideoStatus(videoId, { status: "failed" });
  }
}

async function testRedis(url: string): Promise<boolean> {
  const { Redis } = await import("ioredis");
  return new Promise((resolve) => {
    const client = new Redis(url, {
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      retryStrategy() {
        return null;
      },
      lazyConnect: true,
    });
    const timer = setTimeout(() => {
      client.disconnect();
      resolve(false);
    }, 3000);
    client
      .connect()
      .then(() => {
        clearTimeout(timer);
        client.disconnect();
        resolve(true);
      })
      .catch(() => {
        clearTimeout(timer);
        client.disconnect();
        resolve(false);
      });
  });
}

async function initQueue(): Promise<void> {
  const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

  const isRedisUp = await testRedis(redisUrl);
  if (!isRedisUp) {
    log.warn("Redis not available — falling back to direct processing");
    return;
  }

  try {
    transcodeQueue = new Bull<TranscodeJobData>("transcode", redisUrl, {
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    });

    transcodeQueue.process(1, async (job) => {
      const { videoId, inputPath } = job.data;
      await processTranscodeJob(videoId, inputPath);
    });

    transcodeQueue.on("failed", (job, err) => {
      log.error(`Bull job ${job.id} failed: ${err.message}`, err);
      updateVideoStatus(job.data.videoId, { status: "failed" });
    });

    redisAvailable = true;
    log.info("Bull queue connected to Redis");
  } catch (err) {
    redisAvailable = false;
    log.warn("Failed to initialize Bull queue — using direct processing", err);
  }
}

export async function addTranscodeJob(
  videoId: string,
  inputPath: string
): Promise<void> {
  if (redisAvailable && transcodeQueue) {
    try {
      await transcodeQueue.add({ videoId, inputPath });
      log.info(`Transcode job queued via Bull for video ${videoId}`);
      return;
    } catch (err) {
      log.warn(`Failed to queue via Bull for video ${videoId}, falling back to direct processing`, err);
      // Mark Redis as unavailable so future uploads skip it
      redisAvailable = false;
      transcodeQueue?.close().catch(() => {});
      transcodeQueue = null;
    }
  }

  // Fallback: process directly in background (non-blocking)
  log.info(`Processing transcode directly for video ${videoId} (no Redis)`);
  processTranscodeJob(videoId, inputPath).catch((err) => {
    log.error(`Direct transcode failed for video ${videoId}`, err);
  });
}

export function initTranscodeQueue(): void {
  initQueue().catch((err) => {
    log.warn("Queue initialization error", err);
  });
}

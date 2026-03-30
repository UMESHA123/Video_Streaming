import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";
import { PATHS } from "../config/paths.js";
import { ensureVideoDir } from "./storage.service.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("FFmpeg:Transcode");

interface QualityPreset {
  name: string;
  width: number;
  height: number;
  videoBitrate: string;
  audioBitrate: string;
  maxrate: string;
  bufsize: string;
  bandwidth: number;
}

const QUALITY_PRESETS: QualityPreset[] = [
  {
    name: "360p",
    width: 640,
    height: 360,
    videoBitrate: "800k",
    audioBitrate: "96k",
    maxrate: "856k",
    bufsize: "1200k",
    bandwidth: 800000,
  },
  {
    name: "480p",
    width: 854,
    height: 480,
    videoBitrate: "1400k",
    audioBitrate: "128k",
    maxrate: "1498k",
    bufsize: "2100k",
    bandwidth: 1400000,
  },
  {
    name: "720p",
    width: 1280,
    height: 720,
    videoBitrate: "2800k",
    audioBitrate: "128k",
    maxrate: "2996k",
    bufsize: "4200k",
    bandwidth: 2800000,
  },
  {
    name: "1080p",
    width: 1920,
    height: 1080,
    videoBitrate: "5000k",
    audioBitrate: "192k",
    maxrate: "5350k",
    bufsize: "7500k",
    bandwidth: 5000000,
  },
];

interface ProbeResult {
  duration: number;
  width: number;
  height: number;
}

function probeVideo(inputPath: string): Promise<ProbeResult> {
  log.info(`Probing file: ${inputPath}`);
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) {
        log.error(`ffprobe failed for ${inputPath}`, err);
        reject(err);
        return;
      }
      const duration = metadata.format.duration || 0;
      const videoStream = metadata.streams.find((s) => s.codec_type === "video");
      const width = videoStream?.width || 0;
      const height = videoStream?.height || 0;
      log.info(
        `Probed: ${width}x${height}, duration=${duration}s, format=${metadata.format.format_name}, size=${metadata.format.size} bytes`
      );
      resolve({ duration, width, height });
    });
  });
}

function transcodeQuality(
  inputPath: string,
  outputDir: string,
  preset: QualityPreset
): Promise<void> {
  return new Promise((resolve, reject) => {
    const qualityDir = path.join(outputDir, preset.name);
    if (!fs.existsSync(qualityDir)) {
      fs.mkdirSync(qualityDir, { recursive: true });
    }

    const playlistPath = path.join(qualityDir, "playlist.m3u8");

    log.info(`Starting ${preset.name} transcode: ${inputPath} → ${qualityDir}`);

    // scale + pad to ensure even dimensions (libx264 requires width & height divisible by 2)
    const scaleFilter =
      `scale=w=${preset.width}:h=${preset.height}:force_original_aspect_ratio=decrease,` +
      `pad=ceil(iw/2)*2:ceil(ih/2)*2`;

    ffmpeg(inputPath)
      .outputOptions([
        "-c:v libx264",
        "-c:a aac",
        `-b:v ${preset.videoBitrate}`,
        `-b:a ${preset.audioBitrate}`,
        `-maxrate ${preset.maxrate}`,
        `-bufsize ${preset.bufsize}`,
        `-vf ${scaleFilter}`,
        "-sc_threshold 0",
        "-g 48",
        "-keyint_min 48",
        "-hls_time 4",
        "-hls_playlist_type vod",
        `-hls_segment_filename ${path.join(qualityDir, "segment_%03d.ts")}`,
        "-f hls",
      ])
      .output(playlistPath)
      .on("start", (cmd) => {
        log.info(`FFmpeg command [${preset.name}]: ${cmd}`);
      })
      .on("progress", (progress) => {
        if (progress.percent) {
          log.debug(`${preset.name} progress: ${progress.percent.toFixed(1)}%`);
        }
      })
      .on("end", () => {
        log.info(`Transcoding ${preset.name} complete`);
        resolve();
      })
      .on("error", (err, _stdout, stderr) => {
        log.error(`Transcoding ${preset.name} failed: ${err.message}`);
        if (stderr) log.error(`FFmpeg stderr [${preset.name}]:`, stderr);
        reject(err);
      })
      .run();
  });
}

function generateMasterPlaylist(
  outputDir: string,
  transcodedPresets: QualityPreset[]
): void {
  const lines: string[] = ["#EXTM3U", "#EXT-X-VERSION:3", ""];

  for (const preset of transcodedPresets) {
    const playlistPath = path.join(outputDir, preset.name, "playlist.m3u8");
    if (fs.existsSync(playlistPath)) {
      lines.push(
        `#EXT-X-STREAM-INF:BANDWIDTH=${preset.bandwidth},RESOLUTION=${preset.width}x${preset.height}`
      );
      lines.push(`${preset.name}/playlist.m3u8`);
      lines.push("");
    }
  }

  const masterPath = path.join(outputDir, "master.m3u8");
  fs.writeFileSync(masterPath, lines.join("\n"), "utf-8");
  log.info(`Master playlist written: ${masterPath} (${transcodedPresets.length} qualities)`);
}

export async function transcodeToHLS(
  videoId: string,
  inputPath: string
): Promise<{ duration: number; hlsUrl: string }> {
  log.info(`=== Starting HLS transcode for video ${videoId} ===`);
  log.info(`Input file: ${inputPath}`);

  if (!fs.existsSync(inputPath)) {
    log.error(`Input file not found: ${inputPath}`);
    throw new Error(`Input file not found: ${inputPath}`);
  }

  const stat = fs.statSync(inputPath);
  log.info(`Input file size: ${(stat.size / 1024 / 1024).toFixed(2)} MB`);

  const outputDir = ensureVideoDir(videoId);
  log.info(`Output directory: ${outputDir}`);

  const { duration, width, height } = await probeVideo(inputPath);

  // Only transcode qualities that are <= source resolution (no upscaling)
  const applicablePresets = QUALITY_PRESETS.filter((p) => p.height <= height);
  if (applicablePresets.length === 0) {
    // Source is smaller than 360p — just use the lowest preset
    applicablePresets.push(QUALITY_PRESETS[0]);
  }

  log.info(
    `Source: ${width}x${height} → transcoding: ${applicablePresets.map((p) => p.name).join(", ")}`
  );

  // Transcode each quality level sequentially
  for (const preset of applicablePresets) {
    const startTime = Date.now();
    await transcodeQuality(inputPath, outputDir, preset);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    log.info(`${preset.name} completed in ${elapsed}s`);
  }

  generateMasterPlaylist(outputDir, applicablePresets);

  // Clean up the original upload
  try {
    fs.unlinkSync(inputPath);
    log.info(`Cleaned up upload file: ${inputPath}`);
  } catch {
    log.warn(`Could not delete upload file: ${inputPath}`);
  }

  const hlsUrl = `/api/stream/${videoId}/master.m3u8`;
  log.info(`=== Transcode complete for video ${videoId} → ${hlsUrl} ===`);

  return { duration, hlsUrl };
}

export async function extractThumbnail(
  videoId: string,
  inputPath: string
): Promise<string> {
  const thumbnailFilename = `${videoId}.jpg`;
  const thumbnailPath = path.join(PATHS.thumbnails, thumbnailFilename);

  const { duration } = await probeVideo(inputPath);
  const seekTime = Math.max(0, duration * 0.1);

  log.info(`Extracting thumbnail for video ${videoId} at ${seekTime.toFixed(1)}s`);

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .seekInput(seekTime)
      .frames(1)
      .outputOptions([
        "-vf",
        "scale=640:360:force_original_aspect_ratio=decrease,pad=ceil(iw/2)*2:ceil(ih/2)*2",
      ])
      .output(thumbnailPath)
      .on("start", (cmd) => {
        log.info(`Thumbnail command: ${cmd}`);
      })
      .on("end", () => {
        log.info(`Thumbnail extracted for video ${videoId}`);
        resolve(`/thumbnails/${thumbnailFilename}`);
      })
      .on("error", (err, _stdout, stderr) => {
        log.error(`Thumbnail failed for video ${videoId}: ${err.message}`);
        if (stderr) log.error(`Thumbnail stderr:`, stderr);
        reject(err);
      })
      .run();
  });
}

import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..", "..");

export const PATHS = {
  projectRoot: PROJECT_ROOT,
  storage: path.join(PROJECT_ROOT, "storage"),
  uploads: path.join(PROJECT_ROOT, "storage", "uploads"),
  videos: path.join(PROJECT_ROOT, "storage", "videos"),
  thumbnails: path.join(PROJECT_ROOT, "storage", "thumbnails"),
  avatars: path.join(PROJECT_ROOT, "storage", "avatars"),
  db: path.join(PROJECT_ROOT, "data"),
};

import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { PATHS } from "../config/paths.js";

const ALLOWED_MIMETYPES = [
  "video/mp4",
  "video/webm",
  "video/x-msvideo",
  "video/quicktime",
  "video/x-matroska",
  "video/mpeg",
  "application/octet-stream",
];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, PATHS.uploads);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

function fileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void {
  if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: ${ALLOWED_MIMETYPES.join(", ")}`));
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 * 1024, // 10 GB
  },
});

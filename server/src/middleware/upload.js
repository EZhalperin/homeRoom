import multer from "multer";
import { AppError } from "../utils/AppError.js";

const ALLOWED_MIME = new Set(["application/pdf", "image/jpeg", "image/png"]);

/**
 * Memory-storage uploader (max 5MB, pdf/jpg/png only).
 * Not wired to any route yet (absence reports are out of scope).
 */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(new AppError("Only PDF, JPG and PNG files are allowed", 400));
      return;
    }
    cb(null, true);
  },
});

import type { Request, Response, NextFunction } from "express";
import { createLogger } from "../utils/logger.js";

const log = createLogger("ErrorHandler");

export interface AppError extends Error {
  statusCode?: number;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  log.error(`${req.method} ${req.path} → ${statusCode}: ${message}`);
  if (statusCode === 500) {
    log.error("Stack trace", err);
  }

  res.status(statusCode).json({ error: message });
}

export function createError(statusCode: number, message: string): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  return error;
}

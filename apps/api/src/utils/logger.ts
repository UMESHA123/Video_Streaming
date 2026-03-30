type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

function timestamp(): string {
  return new Date().toISOString();
}

function format(level: LogLevel, context: string, message: string, data?: unknown): string {
  const base = `[${timestamp()}] [${level}] [${context}] ${message}`;
  if (data !== undefined) {
    const serialized = data instanceof Error
      ? `${data.message}\n${data.stack}`
      : typeof data === "object"
        ? JSON.stringify(data, null, 2)
        : String(data);
    return `${base}\n  ${serialized}`;
  }
  return base;
}

export function createLogger(context: string) {
  return {
    info: (message: string, data?: unknown) =>
      console.log(format("INFO", context, message, data)),
    warn: (message: string, data?: unknown) =>
      console.warn(format("WARN", context, message, data)),
    error: (message: string, data?: unknown) =>
      console.error(format("ERROR", context, message, data)),
    debug: (message: string, data?: unknown) =>
      console.debug(format("DEBUG", context, message, data)),
  };
}

/**
 * Process-level logger. Application code should use this instead of console.*.
 * @module utils/logger
 */

function write(stream, level, args) {
  const time = new Date().toISOString();
  const parts = args.map((arg) => {
    if (arg instanceof Error) {
      return arg.stack || arg.message;
    }
    if (typeof arg === "string") {
      return arg;
    }
    try {
      return JSON.stringify(arg);
    } catch {
      return String(arg);
    }
  });
  stream.write(`[${time}] ${level}: ${parts.join(" ")}\n`);
}

export const logger = {
  /** @param {...unknown} args */
  info: (...args) => write(process.stdout, "INFO", args),
  /** @param {...unknown} args */
  warn: (...args) => write(process.stderr, "WARN", args),
  /** @param {...unknown} args */
  error: (...args) => write(process.stderr, "ERROR", args),
};

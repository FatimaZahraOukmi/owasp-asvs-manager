import env from "../config/env";

type LogLevel = "info" | "warn" | "error" | "debug";

class Logger {
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ["error", "warn", "info", "debug"];
    const configLevel = env.NODE_ENV === "development" ? "debug" : "info";
    return levels.indexOf(level) <= levels.indexOf(configLevel);
  }

  private formatMessage(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? `\n${JSON.stringify(meta, null, 2)}` : "";
    return `[${timestamp}] [${level.toUpperCase()}]: ${message}${metaStr}`;
  }

  info(message: string, meta?: any): void {
    if (this.shouldLog("info")) {
      console.log(this.formatMessage("info", message, meta));
    }
  }

  warn(message: string, meta?: any): void {
    if (this.shouldLog("warn")) {
      console.warn(this.formatMessage("warn", message, meta));
    }
  }

  error(message: string, error?: any): void {
    if (this.shouldLog("error")) {
      console.error(this.formatMessage("error", message, error));
    }
  }

  debug(message: string, meta?: any): void {
    if (this.shouldLog("debug")) {
      console.debug(this.formatMessage("debug", message, meta));
    }
  }
}

export const logger = new Logger();

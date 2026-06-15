type LogFields = Record<string, unknown>;

function format(level: string, message: string, fields?: LogFields): string {
  const payload = fields ? ` ${JSON.stringify(fields)}` : "";
  return `[${new Date().toISOString()}] ${level.toUpperCase()} ${message}${payload}`;
}

export const logger = {
  info(message: string, fields?: LogFields): void {
    console.log(format("info", message, fields));
  },
  warn(message: string, fields?: LogFields): void {
    console.warn(format("warn", message, fields));
  },
  error(message: string, fields?: LogFields): void {
    console.error(format("error", message, fields));
  }
};

export interface LogContext {
  correlationId?: string;
  userId?: string;
  service?: string;
  error?: Error | unknown;
  [key: string]: unknown;
}

export interface ILogger {
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, errorOrContext?: Error | unknown | LogContext, context?: LogContext): void;
  debug(message: string, context?: LogContext): void;
  child(bindings: LogContext): ILogger;
}

import { ILogger, LogContext } from '../application/ports/ILogger';

export class EdgeLogger implements ILogger {
  constructor(private serviceName: string = 'vibegrid-middleware') {}

  info(message: string, context?: LogContext): void {
    console.info(`[${this.serviceName}] ${message}`, context ? JSON.stringify(context) : '');
  }

  warn(message: string, context?: LogContext): void {
    console.warn(`[${this.serviceName}] ${message}`, context ? JSON.stringify(context) : '');
  }

  error(message: string, errorOrContext?: Error | unknown | LogContext, context?: LogContext): void {
    console.error(`[${this.serviceName}] ${message}`, errorOrContext || '', context ? JSON.stringify(context) : '');
  }

  debug(message: string, context?: LogContext): void {
    console.debug(`[${this.serviceName}] ${message}`, context ? JSON.stringify(context) : '');
  }

  child(bindings: LogContext): ILogger {
    return new EdgeLogger(`${this.serviceName}:${bindings.service || 'child'}`);
  }
}

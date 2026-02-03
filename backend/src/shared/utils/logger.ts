interface LogContext {
  userId?: string;
  requestId?: string;
  method?: string;
  path?: string;
  duration?: number;
  [key: string]: unknown;
}

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private serviceName: string;

  constructor(serviceName = 'poll-question-gen-backend') {
    this.serviceName = serviceName;
  }

  private formatLog(level: LogLevel, message: string, context?: LogContext): string {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      message,
      ...context,
    };

    return JSON.stringify(entry);
  }

  info(message: string, context?: LogContext): void {
    console.log(this.formatLog('info', message, context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatLog('warn', message, context));
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const errorContext = {
      ...context,
      ...(error && {
        error: error.message,
        stack: error.stack,
        name: error.name,
      }),
    };

    console.error(this.formatLog('error', message, errorContext));
  }

  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatLog('debug', message, context));
    }
  }

  child(defaultContext: LogContext): Logger {
    const childLogger = new Logger(this.serviceName);

    // Override methods to include default context
    const originalInfo = childLogger.info.bind(childLogger);
    const originalWarn = childLogger.warn.bind(childLogger);
    const originalError = childLogger.error.bind(childLogger);
    const originalDebug = childLogger.debug.bind(childLogger);

    childLogger.info = (message: string, context?: LogContext) => {
      originalInfo(message, { ...defaultContext, ...context });
    };

    childLogger.warn = (message: string, context?: LogContext) => {
      originalWarn(message, { ...defaultContext, ...context });
    };

    childLogger.error = (message: string, error?: Error, context?: LogContext) => {
      originalError(message, error, { ...defaultContext, ...context });
    };

    childLogger.debug = (message: string, context?: LogContext) => {
      originalDebug(message, { ...defaultContext, ...context });
    };

    return childLogger;
  }
}

// Export a singleton instance
export const logger = new Logger();

// Export the class for creating custom instances
export { Logger, LogContext };

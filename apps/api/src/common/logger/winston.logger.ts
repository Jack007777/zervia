import * as winston from 'winston';
import { mkdirSync } from 'node:fs';

export function createWinstonLogger() {
  mkdirSync('logs', { recursive: true });
  return winston.createLogger({
    level: process.env.LOG_LEVEL ?? 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp(),
          winston.format.printf(
            ({ level, message, timestamp }) => `[${timestamp as string}] ${level}: ${message as string}`
          )
        )
      }),
      new winston.transports.File({
        filename: 'logs/api-error.log',
        level: 'error'
      }),
      new winston.transports.File({
        filename: 'logs/api-combined.log'
      })
    ]
  });
}

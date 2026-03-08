import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NextFunction, Request, Response } from 'express';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { WinstonModule } from 'nest-winston';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { createWinstonLogger } from './common/logger/winston.logger';

async function bootstrap() {
  const logger = createWinstonLogger();
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({ instance: logger })
  });
  const expressApp = app.getHttpAdapter().getInstance();
  const trustProxy = process.env.TRUST_PROXY ?? '1';
  const uploadsDir = join(process.cwd(), 'uploads');
  mkdirSync(uploadsDir, { recursive: true });

  expressApp.set('trust proxy', trustProxy === 'true' ? true : trustProxy);

  app.use(helmet());
  app.use('/uploads', express.static(uploadsDir));
  app.use(
    '/api',
    rateLimit({
      windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000),
      limit: Number(process.env.RATE_LIMIT_MAX ?? 120),
      standardHeaders: true,
      legacyHeaders: false
    })
  );

  const corsAllowedOrigins = (
    process.env.CORS_ORIGINS ??
    process.env.WEB_ORIGIN ??
    'http://localhost:3000,https://zervia.eu,https://www.zervia.eu'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void
    ) => {
      if (!origin || corsAllowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());

  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      logger.info('http_request', {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Date.now() - start,
        ip: req.ip
      });
    });
    next();
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Zervia API')
    .setDescription('REST API for Zervia booking platform (EU/DE-first)')
    .setVersion('1.0.0')
    .addServer(process.env.BASE_URL ?? 'http://localhost:4000', 'Current environment')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT access token'
      },
      'bearer'
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  logger.info(`api_started on port ${port}`);
}

void bootstrap();

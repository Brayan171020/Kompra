import 'reflect-metadata';
import 'dotenv/config';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './auth/auth.js';
import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { HttpLoggingInterceptor } from './common/interceptors/http-logging.interceptor.js';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware.js';

async function bootstrap(): Promise<void> {
  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
    app.set('trust proxy', 1);
    const requestLogger = new RequestLoggerMiddleware();
    app.use(requestLogger.use.bind(requestLogger));
    const trustedOrigins = (process.env.TRUSTED_ORIGINS || 'http://localhost:3000')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          frameAncestors: ["'none'"],
          objectSrc: ["'none'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", ...trustedOrigins],
        },
      },
    }));
    app.use(['/api/docs', '/api/v1/auth/reference'], (_request: Request, response: Response, next: NextFunction) => {
      response.setHeader('Content-Security-Policy', [
        "default-src 'self'",
        "base-uri 'self'",
        "frame-ancestors 'none'",
        "object-src 'none'",
        "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
        "img-src 'self' data: https:",
        "font-src 'self' data: https://cdn.jsdelivr.net",
        `connect-src 'self' ${trustedOrigins.join(' ')}`,
      ].join('; '));
      next();
    });
    app.enableCors({
      origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
        if (!origin || trustedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`Origin ${origin} not allowed by CORS`));
      },
      credentials: true,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cookie'],
    });
    app.use('/api/v1/auth', toNodeHandler(auth));
    app.use(express.json());
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new HttpLoggingInterceptor());

    const swaggerConfig = new DocumentBuilder()
      .setTitle('Kompra REST API')
      .setDescription([
        'API REST versionada de Kompra para listas de compras colaborativas, productos reutilizables, plantillas e historial de inventario.',
        '',
        'Las rutas de negocio requieren una sesión de Kompra. Para probarlas, envía el token de sesión con el esquema Bearer. Solo el estado del servicio es público.',
        '',
        'La autenticación con correo, contraseña, enlace mágico y OAuth se documenta en la [referencia Better Auth](/api/v1/auth/reference).',
      ].join('\n'))
      .setVersion('1.0.0')
      .setContact('Brayan Gamboa', 'https://github.com/Brayan171020/Kompra', 'brayangt1710@gmail.com')
      .addServer(process.env.API_PUBLIC_URL || 'https://kompra.onrender.com', 'Producción')
      .addServer('http://localhost:4000', 'Desarrollo local')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'session_token', description: 'Token de sesión emitido por Better Auth.' }, 'bearer')
      .addTag('Salud', 'Disponibilidad de la API y conectividad con PostgreSQL.')
      .addTag('Categorías', 'Categorías de compra. La lectura requiere sesión; solo CREATOR puede crear categorías.')
      .addTag('Listas', 'Creación, consulta, asignación y cierre de listas compartidas.')
      .addTag('Elementos de lista', 'Productos y cantidades dentro de una lista activa.')
      .addTag('Productos', 'Catálogo personal de productos reutilizables.')
      .addTag('Plantillas', 'Plantillas reutilizables para iniciar listas de compra.')
      .addTag('Inventario', 'Registro de compras, transferencias desde listas e informes de despensa.')
      .addTag('Usuarios y contactos', 'Perfil, código de contacto, red de contactos e invitaciones.')
      .setExternalDoc('Autenticación Better Auth', 'https://kompra.onrender.com/api/v1/auth/reference')
      .build();
    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig, { deepScanRoutes: true });
    SwaggerModule.setup('api/docs', app, swaggerDocument, {
      jsonDocumentUrl: 'api/docs-json',
      swaggerOptions: { persistAuthorization: false, filter: true, displayRequestDuration: true },
      customSiteTitle: 'Kompra API | Swagger',
    });

    const port = Number(process.env.PORT || 10000);
    await app.listen(port, '0.0.0.0');
    console.log(`Application is running on: ${await app.getUrl()}`);
  } catch (err) {
    console.error('Error starting server:', err instanceof Error ? err.name : 'UnknownError');
    process.exitCode = 1;
  }
}

void bootstrap();

import { ValidationPipe, INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { raw } from 'express';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

let app: INestApplication;

export async function getApp(): Promise<INestApplication> {
  if (!app) {
    app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);

    app.use(cookieParser());

    const frontendUrl = configService.get<string>('frontend.url');
    const allowedOrigins = frontendUrl
      ? frontendUrl.split(',').map((origin) => origin.trim()).filter(Boolean)
      : [];

    app.enableCors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.length === 0) {
          callback(null, true);
          return;
        }

        if (allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error('Not allowed by CORS'), false);
      },
      credentials: true,
    });

    app.use('/payments/webhook', raw({ type: 'application/json' }));

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(
      new LoggingInterceptor(),
      new ResponseInterceptor(),
    );

    if (process.env.NODE_ENV !== 'production') {
      const swaggerConfig = new DocumentBuilder()
        .setTitle('Aura Commerce API')
        .setDescription('API documentation for Aura Commerce')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
      const document = SwaggerModule.createDocument(app, swaggerConfig);
      SwaggerModule.setup('docs', app, document);
    }
    await app.init();
  }
  return app;
}

async function bootstrap() {
  const application = await getApp();
  const configService = application.get(ConfigService);
  const port = configService.get<number>('port') ?? 4000;
  await application.listen(port);
}

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  bootstrap().catch((error) => {
    console.error('Failed to start Aura Commerce API', error);
    process.exit(1);
  });
}

export default async (req: any, res: any) => {
  const application = await getApp();
  const instance = application.getHttpAdapter().getInstance();
  instance(req, res);
};

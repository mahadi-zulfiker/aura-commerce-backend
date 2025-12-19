"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    app.enableCors({
        origin: configService.get("frontend.url") ?? true,
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    if (process.env.NODE_ENV !== "production") {
        const swaggerConfig = new swagger_1.DocumentBuilder()
            .setTitle("Aura Commerce API")
            .setDescription("API documentation for Aura Commerce")
            .setVersion("1.0")
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
        swagger_1.SwaggerModule.setup("docs", app, document);
    }
    const port = configService.get("port") ?? 4000;
    await app.listen(port);
}
void bootstrap().catch((error) => {
    console.error("Failed to start Aura Commerce API", error);
    process.exit(1);
});
//# sourceMappingURL=main.js.map
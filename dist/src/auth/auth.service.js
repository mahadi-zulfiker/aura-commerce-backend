"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../database/prisma.service");
const email_service_1 = require("../utils/email.service");
const bcrypt = __importStar(require("bcryptjs"));
let AuthService = class AuthService {
    prisma;
    jwtService;
    configService;
    emailService;
    constructor(prisma, jwtService, configService, emailService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
        this.emailService = emailService;
    }
    async register(dto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (existingUser) {
            throw new common_1.ConflictException('Email already exists');
        }
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const emailVerifyToken = this.generateToken();
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                password: hashedPassword,
                firstName: dto.firstName,
                lastName: dto.lastName,
                phone: dto.phone,
                emailVerifyToken,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isEmailVerified: true,
            },
        });
        const tokens = await this.generateTokens(user.id, user.email, user.role);
        const emailSent = await this.sendEmailVerification(user.email, emailVerifyToken);
        return {
            user,
            emailVerificationRequired: true,
            emailSent,
            verificationToken: this.exposeToken(emailSent, emailVerifyToken),
            ...tokens,
        };
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(dto.password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (user.status !== 'ACTIVE') {
            throw new common_1.UnauthorizedException('Account is suspended');
        }
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
        });
        const tokens = await this.generateTokens(user.id, user.email, user.role);
        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
            },
            ...tokens,
        };
    }
    async refresh(refreshToken) {
        const refreshSecret = this.getRefreshSecret();
        let payload;
        try {
            payload = await this.jwtService.verifyAsync(refreshToken, {
                secret: refreshSecret,
            });
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            select: {
                id: true,
                email: true,
                role: true,
                status: true,
            },
        });
        if (!user || user.status !== 'ACTIVE') {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        return this.generateTokens(user.id, user.email, user.role);
    }
    async requestPasswordReset(email) {
        const user = await this.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            return {
                emailSent: false,
            };
        }
        const resetToken = this.generateToken();
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60);
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                resetPasswordToken: resetToken,
                resetPasswordExpires: expiresAt,
            },
        });
        const emailSent = await this.emailService.sendMail({
            to: user.email,
            subject: 'Reset your Aura Commerce password',
            html: `
        <p>Hello ${user.firstName ?? 'there'},</p>
        <p>Use the token below to reset your password. The token expires in 1 hour.</p>
        <p><strong>${resetToken}</strong></p>
      `,
        });
        return {
            emailSent,
            resetToken: this.exposeToken(emailSent, resetToken),
        };
    }
    async resetPassword(token, password) {
        const user = await this.prisma.user.findFirst({
            where: { resetPasswordToken: token },
        });
        if (!user ||
            !user.resetPasswordExpires ||
            user.resetPasswordExpires < new Date()) {
            throw new common_1.BadRequestException('Reset token is invalid or expired');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetPasswordToken: null,
                resetPasswordExpires: null,
            },
        });
        return {
            message: 'Password updated successfully',
        };
    }
    async verifyEmail(token) {
        const user = await this.prisma.user.findFirst({
            where: { emailVerifyToken: token },
        });
        if (!user) {
            throw new common_1.BadRequestException('Verification token is invalid');
        }
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                isEmailVerified: true,
                emailVerifyToken: null,
            },
        });
        return {
            message: 'Email verified successfully',
        };
    }
    async resendVerification(email) {
        const user = await this.prisma.user.findUnique({
            where: { email },
        });
        if (!user || user.isEmailVerified) {
            return {
                emailSent: false,
            };
        }
        const emailVerifyToken = this.generateToken();
        await this.prisma.user.update({
            where: { id: user.id },
            data: { emailVerifyToken },
        });
        const emailSent = await this.sendEmailVerification(user.email, emailVerifyToken);
        return {
            emailSent,
            verificationToken: this.exposeToken(emailSent, emailVerifyToken),
        };
    }
    async generateTokens(userId, email, role) {
        const payload = { sub: userId, email, role };
        const accessToken = await this.jwtService.signAsync(payload);
        const refreshToken = await this.jwtService.signAsync(payload, {
            secret: this.getRefreshSecret(),
            expiresIn: '30d',
        });
        return {
            accessToken,
            refreshToken,
        };
    }
    async sendEmailVerification(email, token) {
        return this.emailService.sendMail({
            to: email,
            subject: 'Verify your Aura Commerce email',
            html: `
        <p>Welcome to Aura Commerce!</p>
        <p>Please verify your email with the token below:</p>
        <p><strong>${token}</strong></p>
      `,
        });
    }
    generateToken() {
        return (0, crypto_1.randomBytes)(32).toString('hex');
    }
    exposeToken(emailSent, token) {
        if (emailSent || process.env.NODE_ENV === 'production') {
            return null;
        }
        return token;
    }
    getRefreshSecret() {
        const secret = this.configService.get('jwt.refreshSecret');
        if (!secret) {
            throw new Error('JWT refresh secret is not set');
        }
        return secret;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService,
        email_service_1.EmailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map
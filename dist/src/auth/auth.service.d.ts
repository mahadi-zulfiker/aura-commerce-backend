import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { EmailService } from '../utils/email.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    private configService;
    private emailService;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService, emailService: EmailService);
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
            isEmailVerified: boolean;
            firstName: string | null;
            lastName: string | null;
        };
        emailVerificationRequired: boolean;
        emailSent: boolean;
        verificationToken: string | null;
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            firstName: string | null;
            lastName: string | null;
            role: import(".prisma/client").$Enums.UserRole;
            isEmailVerified: boolean;
        };
    }>;
    refresh(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    requestPasswordReset(email: string): Promise<{
        emailSent: boolean;
        resetToken?: undefined;
    } | {
        emailSent: boolean;
        resetToken: string | null;
    }>;
    resetPassword(token: string, password: string): Promise<{
        message: string;
    }>;
    verifyEmail(token: string): Promise<{
        message: string;
    }>;
    resendVerification(email: string): Promise<{
        emailSent: boolean;
        verificationToken?: undefined;
    } | {
        emailSent: boolean;
        verificationToken: string | null;
    }>;
    private generateTokens;
    private sendEmailVerification;
    private generateToken;
    private exposeToken;
    private getRefreshSecret;
}

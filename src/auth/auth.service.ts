import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { EmailService } from '../utils/email.service';
import * as bcrypt from 'bcryptjs';

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
};

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) { }

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
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

    const tokens = await this.issueTokens(user.id, user.email, user.role);
    const emailSent = await this.sendEmailVerification(
      user.email,
      emailVerifyToken,
    );

    return {
      user,
      emailVerificationRequired: true,
      emailSent,
      verificationToken: this.exposeToken(emailSent, emailVerifyToken),
      tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is suspended');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const tokens = await this.issueTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
      tokens,
    };
  }

  async refresh(refreshToken: string) {
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hashToken(refreshToken) },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
            firstName: true,
            lastName: true,
            isEmailVerified: true,
          },
        },
      },
    });

    if (
      !tokenRecord ||
      tokenRecord.revokedAt ||
      tokenRecord.expiresAt < new Date()
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (!tokenRecord.user || tokenRecord.user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const rotated = await this.rotateRefreshToken(tokenRecord.id, tokenRecord.userId);
    const accessToken = await this.jwtService.signAsync({
      sub: tokenRecord.user.id,
      email: tokenRecord.user.email,
      role: tokenRecord.user.role,
    });

    return {
      user: {
        id: tokenRecord.user.id,
        email: tokenRecord.user.email,
        firstName: tokenRecord.user.firstName,
        lastName: tokenRecord.user.lastName,
        role: tokenRecord.user.role,
        isEmailVerified: tokenRecord.user.isEmailVerified,
      },
      tokens: {
        accessToken,
        refreshToken: rotated.refreshToken,
        refreshExpiresAt: rotated.refreshExpiresAt,
      },
    };
  }

  async requestPasswordReset(email: string) {
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
        <p>Use the PIN below to reset your password. The PIN expires in 1 hour.</p>
        <p><strong>${resetToken}</strong></p>
      `,
    });

    return {
      emailSent,
      resetToken: this.exposeToken(emailSent, resetToken),
    };
  }

  async resetPassword(token: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: { resetPasswordToken: token },
    });

    if (
      !user ||
      !user.resetPasswordExpires ||
      user.resetPasswordExpires < new Date()
    ) {
      throw new BadRequestException('Reset token is invalid or expired');
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

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: { emailVerifyToken: token },
    });

    if (!user) {
      throw new BadRequestException('Verification token is invalid');
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

  async resendVerification(email: string) {
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

    const emailSent = await this.sendEmailVerification(
      user.email,
      emailVerifyToken,
    );

    return {
      emailSent,
      verificationToken: this.exposeToken(emailSent, emailVerifyToken),
    };
  }

  async revokeRefreshToken(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!existing || existing.revokedAt) {
      return;
    }

    await this.prisma.refreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() },
    });
  }

  private async issueTokens(
    userId: string,
    email: string,
    role: UserRole,
  ): Promise<AuthTokens> {
    const accessToken = await this.jwtService.signAsync({
      sub: userId,
      email,
      role,
    });

    const refreshToken = this.generateRefreshToken();
    const refreshExpiresAt = this.getRefreshExpiresAt();

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: refreshExpiresAt,
      },
    });

    return { accessToken, refreshToken, refreshExpiresAt };
  }

  private async sendEmailVerification(email: string, token: string) {
    return this.emailService.sendMail({
      to: email,
      subject: 'Verify your Aura Commerce email',
      html: `
        <p>Welcome to Aura Commerce!</p>
        <p>Please verify your email with the PIN below:</p>
        <p><strong>${token}</strong></p>
      `,
    });
  }

  private generateToken() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private generateRefreshToken() {
    return randomBytes(64).toString('hex');
  }

  private exposeToken(emailSent: boolean, token: string) {
    if (emailSent || process.env.NODE_ENV === 'production') {
      return null;
    }
    return token;
  }

  private getRefreshExpiresAt() {
    const days =
      this.configService.get<number>('jwt.refreshExpiresInDays') ?? 30;
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  private async rotateRefreshToken(tokenId: string, userId: string) {
    const refreshToken = this.generateRefreshToken();
    const refreshExpiresAt = this.getRefreshExpiresAt();

    const newToken = await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: refreshExpiresAt,
      },
    });

    await this.prisma.refreshToken.update({
      where: { id: tokenId },
      data: {
        revokedAt: new Date(),
        replacedByTokenId: newToken.id,
      },
    });

    return { refreshToken, refreshExpiresAt };
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
}

import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { EmailService } from '../utils/email.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

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

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    const emailSent = await this.sendEmailVerification(
      user.email,
      emailVerifyToken,
    );

    return {
      user,
      emailVerificationRequired: true,
      emailSent,
      verificationToken: this.exposeToken(emailSent, emailVerifyToken),
      ...tokens,
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

  async refresh(refreshToken: string) {
    const refreshSecret = this.getRefreshSecret();

    let payload: { sub: string; email: string; role: UserRole };
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
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
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.generateTokens(user.id, user.email, user.role);
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
        <p>Use the token below to reset your password. The token expires in 1 hour.</p>
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

  private async generateTokens(userId: string, email: string, role: UserRole) {
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

  private async sendEmailVerification(email: string, token: string) {
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

  private generateToken() {
    return randomBytes(32).toString('hex');
  }

  private exposeToken(emailSent: boolean, token: string) {
    if (emailSent || process.env.NODE_ENV === 'production') {
      return null;
    }
    return token;
  }

  private getRefreshSecret() {
    const secret = this.configService.get<string>('jwt.refreshSecret');
    if (!secret) {
      throw new Error('JWT refresh secret is not set');
    }
    return secret;
  }
}

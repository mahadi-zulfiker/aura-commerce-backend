import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Request,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { seconds, Throttle } from '@nestjs/throttler';
import { Response, Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) { }

  @Post('register')
  @Throttle({ default: { ttl: seconds(60), limit: 5 } })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, tokens, ...rest } = await this.authService.register(dto);
    this.setAuthCookies(res, tokens);
    return { user, ...rest };
  }

  @Post('login')
  @Throttle({ default: { ttl: seconds(60), limit: 10 } })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, tokens } = await this.authService.login(dto);
    this.setAuthCookies(res, tokens);
    return { user };
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Initiates the Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, tokens } = await this.authService.googleLogin(req.user);
    this.setAuthCookies(res, tokens);

    // Redirect to frontend dashboard
    const frontendUrl = this.configService.get<string>('frontendUrl') || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/dashboard`);
  }

  @Post('refresh')
  @Throttle({ default: { ttl: seconds(60), limit: 30 } })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Request() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token ?? dto.refreshToken;
    if (!refreshToken) {
      this.clearAuthCookies(res);
      throw new UnauthorizedException('Refresh token missing');
    }
    const { user, tokens } = await this.authService.refresh(refreshToken);
    this.setAuthCookies(res, tokens);
    return { user };
  }

  @Post('forgot-password')
  @Throttle({ default: { ttl: seconds(60), limit: 5 } })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Post('reset-password')
  @Throttle({ default: { ttl: seconds(60), limit: 5 } })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @Post('verify-email')
  @Throttle({ default: { ttl: seconds(60), limit: 5 } })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Post('resend-verification')
  @Throttle({ default: { ttl: seconds(60), limit: 5 } })
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto.email);
  }

  @Post('logout')
  @HttpCode(200)
  async logout(
    @Request() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token;
    if (refreshToken) {
      await this.authService.revokeRefreshToken(refreshToken);
    }
    this.clearAuthCookies(res);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req: { user: unknown }) {
    return req.user;
  }

  private setAuthCookies(
    res: Response,
    tokens: { accessToken: string; refreshToken: string; refreshExpiresAt: Date },
  ) {
    const isProd = this.configService.get<string>('nodeEnv') === 'production';
    const accessMaxAge = this.getAccessTokenMaxAge();
    const refreshMaxAge = Math.max(
      0,
      tokens.refreshExpiresAt.getTime() - Date.now(),
    );

    const cookieOptions: any = {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax', // Correct: sameSite none requires secure
      path: '/',
    };

    res.cookie('access_token', tokens.accessToken, {
      ...cookieOptions,
      maxAge: accessMaxAge,
    });

    res.cookie('refresh_token', tokens.refreshToken, {
      ...cookieOptions,
      maxAge: refreshMaxAge,
    });
  }

  private clearAuthCookies(res: Response) {
    const isProd = this.configService.get<string>('nodeEnv') === 'production';
    const cookieOptions: any = {
      path: '/',
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
    };
    res.clearCookie('access_token', cookieOptions);
    res.clearCookie('refresh_token', cookieOptions);
  }

  private getAccessTokenMaxAge() {
    const expiresIn =
      this.configService.get<string>('jwt.expiresIn') ?? '7d';
    const normalized = expiresIn.trim();
    const match = /^(\d+)(ms|s|m|h|d)?$/i.exec(normalized);
    if (!match) {
      return 1000 * 60 * 60;
    }

    const value = Number(match[1]);
    const unit = (match[2] ?? 's').toLowerCase();
    switch (unit) {
      case 'ms':
        return value;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      case 's':
      default:
        return value * 1000;
    }
  }
}

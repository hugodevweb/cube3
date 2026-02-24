import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

const ACCESS_TOKEN_TTL_MS = 5 * 60 * 1000;   // 5 minutes
const REFRESH_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
): void {
  const isProd = process.env.NODE_ENV === 'production';

  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    maxAge: ACCESS_TOKEN_TTL_MS,
  });

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    maxAge: REFRESH_TOKEN_TTL_MS,
    path: '/auth/refresh',
  });
}

function clearAuthCookies(res: Response): void {
  res.clearCookie('access_token');
  res.clearCookie('refresh_token', { path: '/auth/refresh' });
}

@ApiTags('auth')
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with username and password' })
  @ApiResponse({ status: 200, description: 'Sets HttpOnly auth cookies and returns a success message.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const tokens = await this.authService.login(dto);
    setAuthCookies(res, tokens.access_token, tokens.refresh_token);
    return { message: 'Login successful' };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logout and clear auth cookies' })
  @ApiCookieAuth('access_token')
  @ApiResponse({ status: 204, description: 'Cookies cleared.' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const refreshToken: string | undefined = req.cookies?.refresh_token;
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }
    clearAuthCookies(res);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Return the current authenticated user' })
  @ApiCookieAuth('access_token')
  @ApiResponse({ status: 200, description: 'Current user claims from the JWT.' })
  @ApiResponse({ status: 401, description: 'Not authenticated.' })
  me(@Req() req: Request): Record<string, unknown> {
    return req.user as Record<string, unknown>;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using the refresh_token cookie' })
  @ApiCookieAuth('access_token')
  @ApiResponse({ status: 200, description: 'New cookies issued.' })
  @ApiResponse({ status: 401, description: 'Refresh token missing or expired.' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const refreshToken: string | undefined = req.cookies?.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }
    const tokens = await this.authService.refresh(refreshToken);
    setAuthCookies(res, tokens.access_token, tokens.refresh_token);
    return { message: 'Token refreshed' };
  }
}

import { Controller, All, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiCookieAuth } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ProxyService } from './proxy.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL ?? 'http://auth:3001';
const VENTE_SERVICE_URL =
  process.env.VENTE_SERVICE_URL ?? 'http://vente:3002';
const COMMUNAUTE_SERVICE_URL =
  process.env.COMMUNAUTE_SERVICE_URL ?? 'http://communaute:3003';
const MEDIA_SERVICE_URL =
  process.env.MEDIA_SERVICE_URL ?? 'http://media:3004';

/**
 * Proxy controller — matches every HTTP method on each service prefix and
 * forwards the request to the appropriate downstream service.
 *
 * All routes run under the global `api` prefix (set in main.ts), so the
 * full public paths are /api/auth/*, /api/vente/*, etc.
 *
 * Rate-limiting (ThrottlerGuard) applies to every route in this controller.
 * JWT validation (JwtAuthGuard) applies to all routes except /auth/*, which
 * the Auth Service itself secures.
 */
@ApiTags('proxy')
@Controller()
@UseGuards(ThrottlerGuard)
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  /** Public — login, logout, refresh, and token endpoints are handled by the Auth Service. */
  @All('/auth/*')
  @ApiOperation({ summary: 'Proxy → Auth Service (public)' })
  proxyToAuth(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.forward(req, res, AUTH_SERVICE_URL);
  }

  @All('/vente/*')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Proxy → Vente Service (JWT required)' })
  @ApiCookieAuth('access_token')
  proxyToVente(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.forward(req, res, VENTE_SERVICE_URL);
  }

  @All('/communaute/*')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Proxy → Communauté Service (JWT required)' })
  @ApiCookieAuth('access_token')
  proxyToCommunaute(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.forward(req, res, COMMUNAUTE_SERVICE_URL);
  }

  @All('/media/*')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Proxy → Média Service (JWT required)' })
  @ApiCookieAuth('access_token')
  proxyToMedia(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.forward(req, res, MEDIA_SERVICE_URL);
  }
}

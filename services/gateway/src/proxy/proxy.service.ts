import { Injectable, HttpException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Request, Response } from 'express';
import { AxiosError, AxiosRequestConfig } from 'axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);

  constructor(private readonly httpService: HttpService) {}

  /**
   * Forward an incoming request to a downstream service.
   *
   * @param req          - Original Express request (headers + body forwarded as-is)
   * @param res          - Express response to pipe the upstream reply into
   * @param targetBaseUrl - Base URL of the downstream service (e.g. http://auth:3001)
   * @param stripPrefix   - URL prefix to strip before forwarding (default: '/api')
   */
  async forward(
    req: Request,
    res: Response,
    targetBaseUrl: string,
    stripPrefix = '/api',
  ): Promise<void> {
    let path = req.url;
    if (stripPrefix && path.startsWith(stripPrefix)) {
      path = path.slice(stripPrefix.length) || '/';
    }

    const url = `${targetBaseUrl}${path}`;

    // Hop-by-hop headers must not be forwarded between proxies (RFC 7230 §6.1).
    // `content-length` is also dropped so axios recalculates it from the actual
    // re-serialised body — forwarding the original length can cause a mismatch
    // when Nginx (or any intermediate proxy) rewrites the body as chunked.
    const HOP_BY_HOP = new Set([
      'host',
      'connection',
      'keep-alive',
      'transfer-encoding',
      'te',
      'trailers',
      'upgrade',
      'proxy-authorization',
      'proxy-authenticate',
      'content-length',
    ]);

    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (HOP_BY_HOP.has(key.toLowerCase())) continue;
      if (value !== undefined) {
        headers[key] = Array.isArray(value) ? value.join(', ') : value;
      }
    }

    const config: AxiosRequestConfig = {
      method: req.method as AxiosRequestConfig['method'],
      url,
      headers,
      data: req.body,
      // Pass all statuses through so the downstream status code reaches the client
      validateStatus: () => true,
      // Use arraybuffer to handle both text and binary responses (e.g. media streams)
      responseType: 'arraybuffer',
    };

    try {
      this.logger.log(`Proxying ${req.method} ${req.url} → ${url}`);
      const upstream = await firstValueFrom(this.httpService.request(config));

      res.status(upstream.status);
      for (const [key, value] of Object.entries(upstream.headers)) {
        if (value !== undefined) {
          res.set(key, value as string | string[]);
        }
      }
      res.end(upstream.data);
    } catch (error) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status ?? 502;
      const message = axiosError.message ?? 'Bad Gateway';
      this.logger.error(`Upstream error for ${url}: ${message}`);
      throw new HttpException(message, status);
    }
  }
}

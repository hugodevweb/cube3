import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { HttpException, Logger } from '@nestjs/common';
import { ProxyService } from './proxy.service';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { Request, Response } from 'express';

const mockHttpService = {
  request: jest.fn(),
};

function makeRequest(overrides: Partial<Request> = {}): Request {
  return {
    method: 'GET',
    url: '/api/vente/products',
    headers: { 'content-type': 'application/json', cookie: 'access_token=tok' },
    body: undefined,
    ...overrides,
  } as unknown as Request;
}

function makeResponse(): jest.Mocked<Response> {
  const res = {
    status: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    end: jest.fn(),
  } as unknown as jest.Mocked<Response>;
  return res;
}

describe('ProxyService', () => {
  let service: ProxyService;
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProxyService,
        { provide: HttpService, useValue: mockHttpService },
      ],
    }).compile();

    service = module.get<ProxyService>(ProxyService);
    // Suppress logger output so error-path tests stay silent in the terminal
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    jest.clearAllMocks();
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
  });

  describe('forward()', () => {
    it('strips the /api prefix before forwarding', async () => {
      const axiosResponse: AxiosResponse = {
        status: 200,
        headers: { 'content-type': 'application/json' },
        data: Buffer.from('[]'),
        statusText: 'OK',
        config: {} as any,
      };
      mockHttpService.request.mockReturnValue(of(axiosResponse));

      const req = makeRequest();
      const res = makeResponse();

      await service.forward(req, res, 'http://vente:3002');

      const callConfig = mockHttpService.request.mock.calls[0][0];
      expect(callConfig.url).toBe('http://vente:3002/vente/products');
    });

    it('forwards the cookie header to the upstream service', async () => {
      const axiosResponse: AxiosResponse = {
        status: 200,
        headers: {},
        data: Buffer.from('ok'),
        statusText: 'OK',
        config: {} as any,
      };
      mockHttpService.request.mockReturnValue(of(axiosResponse));

      const req = makeRequest();
      const res = makeResponse();

      await service.forward(req, res, 'http://vente:3002');

      const callConfig = mockHttpService.request.mock.calls[0][0];
      expect(callConfig.headers.cookie).toBe('access_token=tok');
    });

    it('does not forward the host header', async () => {
      const axiosResponse: AxiosResponse = {
        status: 200,
        headers: {},
        data: Buffer.from('ok'),
        statusText: 'OK',
        config: {} as any,
      };
      mockHttpService.request.mockReturnValue(of(axiosResponse));

      const req = makeRequest({ headers: { host: 'gateway:3000' } });
      const res = makeResponse();

      await service.forward(req, res, 'http://vente:3002');

      const callConfig = mockHttpService.request.mock.calls[0][0];
      expect(callConfig.headers.host).toBeUndefined();
    });

    it('pipes the upstream status code and body to the response', async () => {
      const body = Buffer.from(JSON.stringify({ id: 1 }));
      const axiosResponse: AxiosResponse = {
        status: 201,
        headers: { 'content-type': 'application/json' },
        data: body,
        statusText: 'Created',
        config: {} as any,
      };
      mockHttpService.request.mockReturnValue(of(axiosResponse));

      const req = makeRequest({ method: 'POST', url: '/api/vente/orders' });
      const res = makeResponse();

      await service.forward(req, res, 'http://vente:3002');

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.end).toHaveBeenCalledWith(body);
    });

    it('throws HttpException with 502 when the upstream is unreachable', async () => {
      const networkError = new Error('connect ECONNREFUSED');
      mockHttpService.request.mockReturnValue(throwError(() => networkError));

      const req = makeRequest();
      const res = makeResponse();

      await expect(service.forward(req, res, 'http://vente:3002')).rejects.toThrow(
        HttpException,
      );
    });

    it('preserves the upstream error status code', async () => {
      const axiosError: any = new Error('Not Found');
      axiosError.response = { status: 404 };
      mockHttpService.request.mockReturnValue(throwError(() => axiosError));

      const req = makeRequest();
      const res = makeResponse();

      try {
        await service.forward(req, res, 'http://vente:3002');
        fail('Expected HttpException to be thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(HttpException);
        expect((err as HttpException).getStatus()).toBe(404);
      }
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { ProxyController } from './proxy.controller';
import { ProxyService } from './proxy.service';
import { ThrottlerModule } from '@nestjs/throttler';
import { Request, Response } from 'express';

const mockProxyService = {
  forward: jest.fn(),
};

function makeReqRes(method = 'GET', url = '/api/auth/login') {
  const req = { method, url, headers: {}, body: {} } as unknown as Request;
  const res = {
    status: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    end: jest.fn(),
  } as unknown as Response;
  return { req, res };
}

describe('ProxyController', () => {
  let controller: ProxyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }])],
      controllers: [ProxyController],
      providers: [{ provide: ProxyService, useValue: mockProxyService }],
    }).compile();

    controller = module.get<ProxyController>(ProxyController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('proxyToAuth delegates to ProxyService with AUTH_SERVICE_URL', () => {
    const { req, res } = makeReqRes('POST', '/api/auth/login');
    mockProxyService.forward.mockResolvedValue(undefined);

    controller.proxyToAuth(req, res);

    expect(mockProxyService.forward).toHaveBeenCalledTimes(1);
    const [passedReq, passedRes, targetUrl] = mockProxyService.forward.mock.calls[0];
    expect(passedReq).toBe(req);
    expect(passedRes).toBe(res);
    expect(targetUrl).toContain('auth');
  });

  it('proxyToVente delegates to ProxyService with VENTE_SERVICE_URL', () => {
    const { req, res } = makeReqRes('GET', '/api/vente/products');
    mockProxyService.forward.mockResolvedValue(undefined);

    controller.proxyToVente(req, res);

    expect(mockProxyService.forward).toHaveBeenCalledTimes(1);
    const [, , targetUrl] = mockProxyService.forward.mock.calls[0];
    expect(targetUrl).toContain('vente');
  });

  it('proxyToCommunaute delegates to ProxyService with COMMUNAUTE_SERVICE_URL', () => {
    const { req, res } = makeReqRes('GET', '/api/communaute/posts');
    mockProxyService.forward.mockResolvedValue(undefined);

    controller.proxyToCommunaute(req, res);

    expect(mockProxyService.forward).toHaveBeenCalledTimes(1);
    const [, , targetUrl] = mockProxyService.forward.mock.calls[0];
    expect(targetUrl).toContain('communaute');
  });

  it('proxyToMedia delegates to ProxyService with MEDIA_SERVICE_URL', () => {
    const { req, res } = makeReqRes('GET', '/api/media/1/stream');
    mockProxyService.forward.mockResolvedValue(undefined);

    controller.proxyToMedia(req, res);

    expect(mockProxyService.forward).toHaveBeenCalledTimes(1);
    const [, , targetUrl] = mockProxyService.forward.mock.calls[0];
    expect(targetUrl).toContain('media');
  });
});

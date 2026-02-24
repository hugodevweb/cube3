import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

const mockTokens = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 300,
  refresh_expires_in: 1800,
  token_type: 'Bearer',
};

function buildResponse() {
  const cookies: Record<string, unknown> = {};
  const cleared: string[] = [];
  return {
    cookie: jest.fn((name: string, value: string) => {
      cookies[name] = value;
    }),
    clearCookie: jest.fn((name: string) => {
      cleared.push(name);
    }),
    _cookies: cookies,
    _cleared: cleared,
  };
}

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const mockAuthService: Partial<jest.Mocked<AuthService>> = {
      login: jest.fn(),
      logout: jest.fn(),
      refresh: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  describe('POST /auth/login', () => {
    it('doit définir les cookies et retourner un message de succès', async () => {
      authService.login.mockResolvedValueOnce(mockTokens);
      const res = buildResponse() as any;

      const result = await controller.login({ username: 'user-test', password: 'user123' }, res);

      expect(result).toEqual({ message: 'Login successful' });
      expect(res.cookie).toHaveBeenCalledWith('access_token', 'mock-access-token', expect.any(Object));
      expect(res.cookie).toHaveBeenCalledWith('refresh_token', 'mock-refresh-token', expect.any(Object));
    });

    it('doit propager une UnauthorizedException si les credentials sont invalides', async () => {
      authService.login.mockRejectedValueOnce(new UnauthorizedException('Invalid credentials'));
      const res = buildResponse() as any;

      await expect(
        controller.login({ username: 'bad', password: 'wrong' }, res),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('POST /auth/logout', () => {
    it('doit appeler le service logout et effacer les cookies', async () => {
      authService.logout.mockResolvedValueOnce(undefined);
      const req = { cookies: { refresh_token: 'rt' } } as any;
      const res = buildResponse() as any;

      await controller.logout(req, res);

      expect(authService.logout).toHaveBeenCalledWith('rt');
      expect(res.clearCookie).toHaveBeenCalledWith('access_token');
      expect(res.clearCookie).toHaveBeenCalledWith('refresh_token', expect.any(Object));
    });

    it('doit effacer les cookies même sans refresh token dans la requête', async () => {
      const req = { cookies: {} } as any;
      const res = buildResponse() as any;

      await controller.logout(req, res);

      expect(authService.logout).not.toHaveBeenCalled();
      expect(res.clearCookie).toHaveBeenCalledTimes(2);
    });
  });

  describe('GET /auth/me', () => {
    it('doit retourner le payload JWT de la requête', () => {
      const payload = { sub: 'user-id', preferred_username: 'user-test', realm_access: { roles: ['user'] } };
      const req = { user: payload } as any;

      const result = controller.me(req);

      expect(result).toEqual(payload);
    });
  });

  describe('POST /auth/refresh', () => {
    it('doit mettre à jour les cookies et retourner un message de succès', async () => {
      authService.refresh.mockResolvedValueOnce(mockTokens);
      const req = { cookies: { refresh_token: 'old-rt' } } as any;
      const res = buildResponse() as any;

      const result = await controller.refresh(req, res);

      expect(result).toEqual({ message: 'Token refreshed' });
      expect(authService.refresh).toHaveBeenCalledWith('old-rt');
      expect(res.cookie).toHaveBeenCalledWith('access_token', 'mock-access-token', expect.any(Object));
    });

    it('doit lever UnauthorizedException si aucun refresh token nest présent', async () => {
      const req = { cookies: {} } as any;
      const res = buildResponse() as any;

      await expect(controller.refresh(req, res)).rejects.toThrow(UnauthorizedException);
    });
  });
});

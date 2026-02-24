import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import { AuthService } from './auth.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockTokenResponse = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 300,
  refresh_expires_in: 1800,
  token_type: 'Bearer',
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('doit retourner les tokens lors dun login valide', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: mockTokenResponse });

      const result = await service.login({ username: 'user-test', password: 'user123' });

      expect(result).toEqual(mockTokenResponse);
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
      const [url, body] = mockedAxios.post.mock.calls[0];
      expect(url).toContain('/protocol/openid-connect/token');
      expect(body).toContain('grant_type=password');
      expect(body).toContain('username=user-test');
    });

    it('doit lever UnauthorizedException si Keycloak renvoie 401', async () => {
      const error = { response: { status: 401 }, message: 'Unauthorized' };
      mockedAxios.post.mockRejectedValueOnce(error);

      await expect(
        service.login({ username: 'bad', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('doit lever UnauthorizedException si Keycloak renvoie 400', async () => {
      const error = { response: { status: 400 }, message: 'Bad Request' };
      mockedAxios.post.mockRejectedValueOnce(error);

      await expect(
        service.login({ username: 'bad', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('doit lever InternalServerErrorException si Keycloak est indisponible', async () => {
      const error = { response: { status: 503 }, message: 'Service Unavailable' };
      mockedAxios.post.mockRejectedValueOnce(error);

      await expect(
        service.login({ username: 'user-test', password: 'user123' }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('refresh', () => {
    it('doit retourner de nouveaux tokens avec un refresh token valide', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: mockTokenResponse });

      const result = await service.refresh('valid-refresh-token');

      expect(result).toEqual(mockTokenResponse);
      const [, body] = mockedAxios.post.mock.calls[0];
      expect(body).toContain('grant_type=refresh_token');
      expect(body).toContain('refresh_token=valid-refresh-token');
    });

    it('doit lever UnauthorizedException si le refresh token est invalide (400)', async () => {
      const error = { response: { status: 400 }, message: 'Bad Request' };
      mockedAxios.post.mockRejectedValueOnce(error);

      await expect(service.refresh('expired-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('doit lever InternalServerErrorException si Keycloak est indisponible', async () => {
      const error = { response: { status: 500 }, message: 'Internal Server Error' };
      mockedAxios.post.mockRejectedValueOnce(error);

      await expect(service.refresh('some-token')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('logout', () => {
    it('doit appeler le logout endpoint de Keycloak', async () => {
      mockedAxios.post.mockResolvedValueOnce({});

      await service.logout('valid-refresh-token');

      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
      const [url, body] = mockedAxios.post.mock.calls[0];
      expect(url).toContain('/protocol/openid-connect/logout');
      expect(body).toContain('refresh_token=valid-refresh-token');
    });

    it('doit se terminer sans erreur si la session est déjà invalide (400)', async () => {
      const error = { response: { status: 400 }, message: 'Bad Request' };
      mockedAxios.post.mockRejectedValueOnce(error);

      await expect(service.logout('expired-token')).resolves.toBeUndefined();
    });

    it('doit se terminer sans erreur si Keycloak renvoie une erreur réseau', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(service.logout('some-token')).resolves.toBeUndefined();
    });
  });
});

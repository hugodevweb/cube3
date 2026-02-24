import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { LoginDto } from './dto/login.dto';

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  private get keycloakUrl(): string {
    return process.env.KEYCLOAK_URL ?? 'http://keycloak:8080';
  }

  private get realm(): string {
    return process.env.KEYCLOAK_REALM ?? 'maison-epouvante';
  }

  private get clientId(): string {
    return process.env.KEYCLOAK_CLIENT_ID ?? 'maison-backend';
  }

  private get clientSecret(): string {
    return process.env.KEYCLOAK_CLIENT_SECRET ?? '';
  }

  private get tokenEndpoint(): string {
    return `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`;
  }

  private get logoutEndpoint(): string {
    return `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/logout`;
  }

  async login(dto: LoginDto): Promise<TokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'password',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      username: dto.username,
      password: dto.password,
      scope: 'openid profile email',
    });

    try {
      const { data } = await axios.post<TokenResponse>(
        this.tokenEndpoint,
        params.toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      );
      return data;
    } catch (err) {
      const axiosErr = err as AxiosError<{ error_description?: string }>;
      const status = axiosErr.response?.status;
      if (status === 401 || status === 400) {
        throw new UnauthorizedException('Invalid credentials');
      }
      this.logger.error('Keycloak login error', axiosErr.message);
      throw new InternalServerErrorException('Authentication service unavailable');
    }
  }

  async refresh(refreshToken: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: refreshToken,
    });

    try {
      const { data } = await axios.post<TokenResponse>(
        this.tokenEndpoint,
        params.toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      );
      return data;
    } catch (err) {
      const axiosErr = err as AxiosError;
      const status = axiosErr.response?.status;
      if (status === 400 || status === 401) {
        throw new UnauthorizedException('Refresh token is invalid or expired');
      }
      this.logger.error('Keycloak refresh error', axiosErr.message);
      throw new InternalServerErrorException('Authentication service unavailable');
    }
  }

  async logout(refreshToken: string): Promise<void> {
    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: refreshToken,
    });

    try {
      await axios.post(
        this.logoutEndpoint,
        params.toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      );
    } catch (err) {
      const axiosErr = err as AxiosError;
      // 400 means the session was already invalidated — treat as success
      if (axiosErr.response?.status !== 400) {
        this.logger.warn('Keycloak logout warning', axiosErr.message);
      }
    }
  }
}

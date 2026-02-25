import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { Request } from 'express';

function cookieExtractor(req: Request): string | null {
  if (req && req.cookies) {
    return req.cookies['access_token'] ?? null;
  }
  return null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const keycloakUrl = process.env.KEYCLOAK_URL ?? 'http://keycloak:8080';
    const realm = process.env.KEYCLOAK_REALM ?? 'maison-epouvante';

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
        jwksUri: `${keycloakUrl}/realms/${realm}/protocol/openid-connect/certs`,
      }),
      // Keycloak places the client ID in `azp`, not `aud`, for standard user
      // tokens. Validating `aud` here would always fail unless an Audience
      // protocol mapper is added to the client in Keycloak. The JWKS signature
      // + issuer check is the real security guarantee.
      issuer: `${keycloakUrl}/realms/${realm}`,
      algorithms: ['RS256'],
    });
  }

  async validate(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    return payload;
  }
}

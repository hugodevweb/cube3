import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/** Attach required realm roles to a route handler. */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

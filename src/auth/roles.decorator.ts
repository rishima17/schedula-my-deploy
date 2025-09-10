import { SetMetadata } from '@nestjs/common';
export const Roles = (...roles: ('doctor'|'patient')[]) => SetMetadata('roles', roles);

import jwt, { type SignOptions } from "jsonwebtoken";

import { env } from "../config/env.js";
import { getPermissions } from "./permissions.js";

export interface TokenUser {
  id: string;
  name: string;
  email: string;
  role: string;
  departmentId: string;
}

export interface AccessTokenPayload extends TokenUser {
  permissions: string[];
}

export function signAccessToken(user: TokenUser) {
  const payload: AccessTokenPayload = {
    ...user,
    permissions: getPermissions(user.role),
  };

  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as SignOptions);
}

export function signRefreshToken(user: TokenUser) {
  return jwt.sign({ id: user.id }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as SignOptions);
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as { id: string };
}

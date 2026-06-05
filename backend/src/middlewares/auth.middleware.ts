import type { NextFunction, Request, RequestHandler, Response } from "express";

import { HttpError } from "../utils/http-error.js";
import { hasPermission, type Permission } from "../utils/permissions.js";
import { verifyAccessToken } from "../utils/tokens.js";

export const authenticate: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    throw new HttpError(401, "Token de autenticação não informado.");
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    throw new HttpError(401, "Token inválido ou expirado.");
  }
};

export function authorize(permission: Permission): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      throw new HttpError(401, "Usuário não autenticado.");
    }

    if (!hasPermission(req.user.role, permission)) {
      throw new HttpError(403, "Usuário sem permissão para esta ação.");
    }

    next();
  };
}

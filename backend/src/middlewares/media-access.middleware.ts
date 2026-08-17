import type { RequestHandler } from "express";

import { prisma } from "../database/prisma.js";
import { HttpError } from "../utils/http-error.js";
import { hasPermission } from "../utils/permissions.js";

export const authorizeUploadedMedia: RequestHandler = async (req, _res, next) => {
  if (!req.user) {
    throw new HttpError(401, "Usuário não autenticado.");
  }

  const [folder, reference] = req.path.split("/").filter(Boolean);

  if (folder === "cnh") {
    if (reference !== req.user.id && !hasPermission(req.user.role, "cnh:review")) {
      throw new HttpError(403, "Usuário sem permissão para acessar esta CNH.");
    }
    next();
    return;
  }

  if (folder === "reservations") {
    const reservation = reference
      ? await prisma.reservation.findUnique({
          where: { id: reference },
          select: { userId: true },
        })
      : null;

    if (!reservation) {
      throw new HttpError(404, "Foto não encontrada.");
    }

    const canAccess =
      reservation.userId === req.user.id || hasPermission(req.user.role, "reservations:read-all");
    if (!canAccess) {
      throw new HttpError(403, "Usuário sem permissão para acessar esta foto.");
    }
    next();
    return;
  }

  throw new HttpError(404, "Arquivo não encontrado.");
};

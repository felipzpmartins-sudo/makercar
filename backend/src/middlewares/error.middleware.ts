import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

import { env } from "../config/env.js";
import { HttpError } from "../utils/http-error.js";

export const errorMiddleware: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next,
) => {
  if (error instanceof HttpError) {
    res.status(error.statusCode).json({
      message: error.message,
      details: error.details,
    });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      message: "Dados inválidos.",
      details: error.flatten(),
    });
    return;
  }

  if (error instanceof PrismaClientKnownRequestError) {
    res.status(400).json({
      message: "Erro de banco de dados.",
      code: error.code,
    });
    return;
  }

  console.error(error);
  res.status(500).json({
    message: "Erro interno do servidor.",
    details: env.NODE_ENV === "production" ? undefined : String(error),
  });
};

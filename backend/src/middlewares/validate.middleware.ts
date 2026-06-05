import type { Request, RequestHandler } from "express";
import type { ZodSchema } from "zod";

export type RequestWithValidatedQuery<TQuery = unknown> = Request & {
  validatedQuery?: TQuery;
};

export function validateBody(schema: ZodSchema): RequestHandler {
  return (req, _res, next) => {
    req.body = schema.parse(req.body);
    next();
  };
}

export function validateQuery(schema: ZodSchema): RequestHandler {
  return (req, _res, next) => {
    (req as RequestWithValidatedQuery).validatedQuery = schema.parse(req.query);
    next();
  };
}

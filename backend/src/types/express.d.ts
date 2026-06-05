import type { AccessTokenPayload } from "../utils/tokens.js";

declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

export {};

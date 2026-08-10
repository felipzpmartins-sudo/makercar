import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { corsCredentials, corsOrigins, env } from "./config/env.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { routes } from "./routes/index.js";
import { HttpError } from "./utils/http-error.js";

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: corsOrigins,
    credentials: corsCredentials,
  }),
);
app.use(express.json({ limit: "8mb" }));
app.use(morgan("combined"));
app.use(
  "/uploads",
  express.static(env.PHOTO_STORAGE_DIR, {
    index: false,
    redirect: false,
    setHeaders(response) {
      response.setHeader("X-Content-Type-Options", "nosniff");
      response.setHeader("Cache-Control", "private, no-store");
    },
  }),
);

app.use("/api", routes);

app.use((_req, _res, next) => {
  next(new HttpError(404, "Rota não encontrada."));
});

app.use(errorMiddleware);

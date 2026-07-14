import { execSync } from "node:child_process";
import net from "node:net";

function parseDatabaseUrl(value) {
  const url = new URL(value);
  return {
    host: url.hostname,
    port: Number(url.port || "5432"),
  };
}

function resolveDatabaseUrl() {
  const directCandidates = [
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.POSTGRES_PRIVATE_URL,
    process.env.RAILWAY_DATABASE_URL,
    process.env.RAILWAY_POSTGRESQL_URL,
  ].filter((value) => typeof value === "string" && value.trim().length > 0);

  if (directCandidates.length > 0) {
    return directCandidates[0].trim();
  }

  const host = process.env.PGHOST ?? process.env.POSTGRES_HOST;
  const port = process.env.PGPORT ?? process.env.POSTGRES_PORT ?? "5432";
  const user = process.env.PGUSER ?? process.env.POSTGRES_USER;
  const password = process.env.PGPASSWORD ?? process.env.POSTGRES_PASSWORD;
  const database = process.env.PGDATABASE ?? process.env.POSTGRES_DB;

  if (host && user && database) {
    const url = new URL("postgresql://localhost");
    url.hostname = host;
    url.port = String(port);
    url.username = user;
    if (password) url.password = password;
    url.pathname = `/${database}`;
    url.searchParams.set("schema", "public");
    return url.toString();
  }

  return "";
}

function waitForTcp(host, port, timeoutMs = 120000) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const attempt = () => {
      const socket = net.createConnection({ host, port });

      socket.on("connect", () => {
        socket.end();
        resolve();
      });

      socket.on("error", () => {
        socket.destroy();
        if (Date.now() - startedAt >= timeoutMs) {
          reject(new Error(`Database not reachable at ${host}:${port} within ${timeoutMs}ms`));
          return;
        }
        setTimeout(attempt, 2000);
      });
    };

    attempt();
  });
}

const databaseUrl = resolveDatabaseUrl();

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is required. Set DATABASE_URL or provide PGHOST, PGPORT, PGUSER, PGPASSWORD, and PGDATABASE.",
  );
}

const { host, port } = parseDatabaseUrl(databaseUrl);
process.env.DATABASE_URL = databaseUrl;

console.log(`Waiting for database at ${host}:${port}...`);
await waitForTcp(host, port, Number(process.env.WAIT_FOR_DB_TIMEOUT_MS || "120000"));

console.log("Running Prisma migrations...");
execSync("npm run prisma:deploy", { stdio: "inherit" });

console.log("Bootstrapping database...");
execSync("npm run prisma:bootstrap", { stdio: "inherit" });

console.log("Starting API...");
execSync("npm run serve", { stdio: "inherit" });

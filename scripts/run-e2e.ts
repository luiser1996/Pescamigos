import { spawn } from "node:child_process";
import { cpSync } from "node:fs";
import path from "node:path";

const databaseUrl =
  process.env.E2E_DATABASE_URL ??
  "postgresql://pescamigos:pescamigos_e2e@127.0.0.1:5433/pescamigos_e2e?schema=public";
const env = {
  ...process.env,
  DATABASE_URL: databaseUrl,
  PHOTO_STORAGE_PATH: path.resolve("storage-e2e"),
  LOGIN_RATE_LIMIT_SECRET: "e2e-only-rate-limit-secret",
  MAX_UPLOAD_MB: "2",
  PORT: "3100",
  HOSTNAME: "127.0.0.1",
};

cpSync("public", ".next/standalone/public", { recursive: true, force: true });
cpSync(".next/static", ".next/standalone/.next/static", {
  recursive: true,
  force: true,
});

const server = spawn(
  process.execPath,
  ["server.js"],
  { cwd: ".next/standalone", env, stdio: "inherit" },
);

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (server.exitCode !== null)
      throw new Error(`El servidor E2E terminó con código ${server.exitCode}`);
    try {
      const response = await fetch("http://127.0.0.1:3100/login");
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("El servidor E2E no respondió en 30 segundos");
}

async function run() {
  try {
    await waitForServer();
    const tests = spawn(
      process.execPath,
      ["node_modules/@playwright/test/cli.js", "test"],
      { env, stdio: "inherit" },
    );
    const code = await new Promise<number>((resolve, reject) => {
      tests.once("error", reject);
      tests.once("exit", (exitCode) => resolve(exitCode ?? 1));
    });
    if (code !== 0) process.exitCode = code;
  } finally {
    server.kill();
  }
}

run().catch((error) => {
  console.error(error);
  server.kill();
  process.exitCode = 1;
});

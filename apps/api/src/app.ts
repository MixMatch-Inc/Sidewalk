import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import morgan from "morgan";
import { z } from "zod";

import { readServiceEnv } from "@sidewalk/config";
import type { ApiHealth, AuthStatus, RegisterResponse, LoginResponse, AuthErrorResponse } from "@sidewalk/types";
import type { Account } from "./models/account.js";
import { toPublic } from "./models/account.js";
import { hashPassword, verifyPassword } from "./services/password.js";

const env = readServiceEnv(
  "api",
  z.object({
    PORT: z.coerce.number().default(4000),
    APP_ENV: z.enum(["development", "test", "production"]).default("development"),
    JWT_SECRET: z.string().min(8).default("replace-me"),
    ALLOWED_ORIGIN: z.string().url().default("http://localhost:3000")
  })
);

export const app: Express = express();

app.use(helmet());
app.use(cors({ origin: env.ALLOWED_ORIGIN, credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_request, response) => {
  const payload: ApiHealth = { service: "api", status: "ok", timestamp: new Date().toISOString() };
  response.json(payload);
});

app.get("/auth/status", (_request, response) => {
  const payload: AuthStatus = {
    phase: "foundation",
    ready: false,
    nextStep: "Build signup, login, session, and recovery flows in Authentication batch 1."
  };
  response.json(payload);
});

// ── In-memory account store (replaced by a DB in a later milestone) ───────────
const accounts = new Map<string, Account>();
let nextId = 1;

const registerSchema = z.object({ email: z.string().email(), password: z.string().min(8) });
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

app.post("/auth/register", async (request, response) => {
  const parsed = registerSchema.safeParse(request.body);
  if (!parsed.success) {
    const err: AuthErrorResponse = { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message };
    response.status(400).json(err);
    return;
  }

  const { email, password } = parsed.data;
  if ([...accounts.values()].some((a) => a.email === email)) {
    const err: AuthErrorResponse = { code: "EMAIL_TAKEN", message: "Email already registered." };
    response.status(409).json(err);
    return;
  }

  const now = new Date();
  const account: Account = {
    id: String(nextId++),
    email,
    passwordHash: await hashPassword(password),
    verified: false,
    createdAt: now,
    updatedAt: now
  };
  accounts.set(account.id, account);

  const pub = toPublic(account);
  const body: RegisterResponse = { id: pub.id, email: pub.email, verified: pub.verified, createdAt: pub.createdAt.toISOString() };
  response.status(201).json(body);
});

app.post("/auth/login", async (request, response) => {
  const parsed = loginSchema.safeParse(request.body);
  if (!parsed.success) {
    const err: AuthErrorResponse = { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message };
    response.status(400).json(err);
    return;
  }

  const { email, password } = parsed.data;
  const account = [...accounts.values()].find((a) => a.email === email);
  if (!account || !(await verifyPassword(password, account.passwordHash))) {
    const err: AuthErrorResponse = { code: "INVALID_CREDENTIALS", message: "Invalid email or password." };
    response.status(401).json(err);
    return;
  }

  const token = Buffer.from(JSON.stringify({ sub: account.id, iat: Date.now() })).toString("base64url");
  const body: LoginResponse = { token, account: { id: account.id, email: account.email, verified: account.verified } };
  response.status(200).json(body);
});

export { env };

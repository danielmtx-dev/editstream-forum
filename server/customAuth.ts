/**
 * Custom Authentication Module
 * Handles username + password login with JWT sessions
 * Admin is EXCLUSIVELY @Danielssh - hardcoded, no exceptions
 * Ban messages: temp_banned shows time remaining, banned shows permanent message
 */
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { ENV } from "./_core/env";
import {
  createCustomUser,
  getCustomUserByLogin,
  getCustomUserById,
  incrementFailedLogin,
  resetFailedLogin,
} from "./db";
import type { CustomUser } from "../drizzle/schema";

const SALT_ROUNDS = 12;
const ADMIN_USERNAME = "Danielssh";
const CUSTOM_COOKIE_NAME = "es_session";

/** Hash a password with bcrypt */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/** Verify a password against a hash */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Create a JWT token for a custom user */
export async function createCustomToken(user: CustomUser, rememberMe = false): Promise<string> {
  const secret = new TextEncoder().encode(ENV.cookieSecret);
  const expiresIn = rememberMe ? 90 * 24 * 60 * 60 : 7 * 24 * 60 * 60; // 90 days or 7 days
  return new SignJWT({
    userId: user.id,
    username: user.username,
    role: user.role,
    type: "custom",
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresIn)
    .sign(secret);
}

/** Verify a custom JWT token */
export async function verifyCustomToken(token: string): Promise<{
  userId: number;
  username: string;
  role: string;
} | null> {
  try {
    const secret = new TextEncoder().encode(ENV.cookieSecret);
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    if (payload.type !== "custom") return null;
    return {
      userId: payload.userId as number,
      username: payload.username as string,
      role: payload.role as string,
    };
  } catch {
    return null;
  }
}

/** Register a new user - simplified: only username + password */
export async function registerUser(data: {
  username: string;
  password: string;
}): Promise<{ user: CustomUser; token: string }> {
  if (!data.username || data.username.length < 3) {
    throw new Error("Nome de usuário deve ter pelo menos 3 caracteres");
  }
  if (!data.password || data.password.length < 6) {
    throw new Error("Senha deve ter pelo menos 6 caracteres");
  }

  // Check if username is taken
  const existing = await getCustomUserByLogin(data.username);
  if (existing) throw new Error("Nome de usuário já está em uso");

  const passwordHash = await hashPassword(data.password);

  const user = await createCustomUser({
    username: data.username,
    passwordHash,
  });

  const token = await createCustomToken(user);
  return { user, token };
}

/** Login a user with ban-specific error messages */
export async function loginUser(login: string, password: string, rememberMe = false): Promise<{ user: CustomUser; token: string }> {
  const user = await getCustomUserByLogin(login);
  if (!user) throw new Error("Usuário não encontrado");

  // Check if account is locked (brute force protection)
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    throw new Error(`Conta bloqueada por tentativas excessivas. Tente novamente em ${minutesLeft} minutos.`);
  }

  // Check ban status with specific messages
  if (user.banStatus === "banned") {
    const reason = user.banReason ? ` Motivo: ${user.banReason}` : "";
    throw new Error(`BAN_PERMANENT|Sua conta foi banida permanentemente.${reason} Entre em contato com o administrador @Danielssh no Telegram.`);
  }

  if (user.banStatus === "temp_banned") {
    if (user.banExpiresAt && user.banExpiresAt > new Date()) {
      const now = Date.now();
      const expiresAt = user.banExpiresAt.getTime();
      const hoursLeft = Math.ceil((expiresAt - now) / (60 * 60 * 1000));
      const daysLeft = Math.floor(hoursLeft / 24);
      const remainingHours = hoursLeft % 24;
      let timeStr = "";
      if (daysLeft > 0) timeStr += `${daysLeft} dia(s)`;
      if (remainingHours > 0) timeStr += `${timeStr ? " e " : ""}${remainingHours} hora(s)`;
      if (!timeStr) timeStr = "menos de 1 hora";
      const reason = user.banReason ? ` Motivo: ${user.banReason}` : "";
      throw new Error(`BAN_TEMP|Sua conta está temporariamente banida. Tempo restante: ${timeStr}.${reason}`);
    } else {
      // Ban expired, auto-unban
      const { updateCustomUserBanStatus } = await import("./db");
      await updateCustomUserBanStatus(user.id, { banStatus: "active", banReason: undefined, banExpiresAt: null, isActive: true });
    }
  }

  if (!user.isActive && user.banStatus !== "temp_banned") {
    throw new Error("Conta desativada. Contate o administrador.");
  }

  // Verify password
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    await incrementFailedLogin(user.id);
    throw new Error("Senha incorreta");
  }

  // Reset failed attempts on success
  await resetFailedLogin(user.id);

  const token = await createCustomToken(user, rememberMe);
  return { user, token };
}

/** Get current user from cookie */
export async function getCurrentCustomUser(cookieHeader: string | undefined): Promise<CustomUser | null> {
  if (!cookieHeader) return null;

  const cookies = new Map<string, string>();
  cookieHeader.split(";").forEach((c) => {
    const [key, ...val] = c.trim().split("=");
    if (key) cookies.set(key.trim(), val.join("=").trim());
  });

  const token = cookies.get(CUSTOM_COOKIE_NAME);
  if (!token) return null;

  const payload = await verifyCustomToken(token);
  if (!payload) return null;

  const user = await getCustomUserById(payload.userId);
  if (!user) return null;

  // Allow restricted users to still read data, just not perform actions
  // Banned users cannot access at all
  if (user.banStatus === "banned") return null;
  if (user.banStatus === "temp_banned") {
    if (user.banExpiresAt && user.banExpiresAt > new Date()) return null;
  }

  return user;
}

/** Check if a user is the admin (Danielssh) */
export function isAdmin(user: CustomUser | null): boolean {
  if (!user) return false;
  return user.username === ADMIN_USERNAME && user.role === "admin";
}

export { CUSTOM_COOKIE_NAME, ADMIN_USERNAME };

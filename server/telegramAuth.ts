/**
 * Telegram Login Widget Authentication
 * Validates the hash from Telegram Login Widget using HMAC-SHA256
 * Creates or links user accounts based on Telegram data
 */
import crypto from "crypto";
import {
  getCustomUserByTelegramId,
  createCustomUser,
  updateCustomUserTelegram,
} from "./db";
import { createCustomToken } from "./customAuth";
import { hashPassword } from "./customAuth";
import { checkGroupMembership, getGroupInviteLink } from "./telegramBot";
import type { CustomUser } from "../drizzle/schema";

/** Telegram Login Widget data fields */
export interface TelegramLoginData {
  id: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: string;
  hash: string;
}

/**
 * Validate the Telegram Login Widget hash using HMAC-SHA256
 * See: https://core.telegram.org/widgets/login#checking-authorization
 *
 * 1. Create SHA256 hash of the bot token (this is the secret key)
 * 2. Build data-check-string from all fields except hash, sorted alphabetically
 * 3. Compute HMAC-SHA256 of data-check-string using the secret key
 * 4. Compare with the provided hash
 */
export function validateTelegramHash(data: TelegramLoginData, botToken: string): boolean {
  if (!botToken || !data.hash) return false;

  // Step 1: Create secret key = SHA256(bot_token)
  const secretKey = crypto.createHash("sha256").update(botToken).digest();

  // Step 2: Build data-check-string (all fields except hash, sorted, joined by \n)
  const checkFields: string[] = [];
  if (data.auth_date) checkFields.push(`auth_date=${data.auth_date}`);
  if (data.first_name) checkFields.push(`first_name=${data.first_name}`);
  if (data.id) checkFields.push(`id=${data.id}`);
  if (data.last_name) checkFields.push(`last_name=${data.last_name}`);
  if (data.photo_url) checkFields.push(`photo_url=${data.photo_url}`);
  if (data.username) checkFields.push(`username=${data.username}`);

  checkFields.sort();
  const dataCheckString = checkFields.join("\n");

  // Step 3: Compute HMAC-SHA256
  const hmac = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  // Step 4: Compare
  return hmac === data.hash;
}

/**
 * Check if auth_date is not too old (max 1 hour)
 */
export function isAuthDateValid(authDate: string, maxAgeSeconds = 3600): boolean {
  const authTimestamp = parseInt(authDate, 10);
  if (isNaN(authTimestamp)) return false;
  const now = Math.floor(Date.now() / 1000);
  return (now - authTimestamp) <= maxAgeSeconds;
}

/**
 * Process Telegram login: validate, find or create user, return JWT
 */
export async function processTelegramLogin(data: TelegramLoginData, botToken: string): Promise<{
  user: CustomUser;
  token: string;
  isNewUser: boolean;
}> {
  // 1. Validate hash
  if (!validateTelegramHash(data, botToken)) {
    throw new Error("Dados do Telegram inválidos. Hash não corresponde.");
  }

  // 2. Validate auth_date (not older than 1 hour)
  if (!isAuthDateValid(data.auth_date)) {
    throw new Error("Sessão do Telegram expirada. Tente novamente.");
  }

  const telegramId = data.id;
  const telegramUsername = data.username || undefined;
  const telegramFirstName = data.first_name || undefined;
  const telegramLastName = data.last_name || undefined;
  const telegramPhotoUrl = data.photo_url || undefined;
  const displayName = [telegramFirstName, telegramLastName].filter(Boolean).join(" ") || telegramUsername || `tg_${telegramId}`;

  // 3. Check group membership via Telegram API
  const botToken2 = process.env.TELEGRAM_BOT_TOKEN || botToken;
  let isGroupMember = false;
  try {
    const membership = await checkGroupMembership(telegramId, botToken2);
    isGroupMember = membership.isMember;
    console.log(`[TelegramAuth] User ${telegramId} group membership: ${isGroupMember} (status: ${membership.status})`);
  } catch (err) {
    console.error("[TelegramAuth] Group membership check failed:", err);
    // Default to false if check fails
    isGroupMember = false;
  }

  // 4. Check if user already exists with this Telegram ID
  let existingUser = await getCustomUserByTelegramId(telegramId);

  if (existingUser) {
    // Update Telegram info (photo, username may change) + update group membership
    await updateCustomUserTelegram(existingUser.id, {
      telegramId,
      telegramUsername,
      telegramFirstName: displayName,
      telegramPhotoUrl,
      telegramVerified: true,
      isGroupMember,
    });
    // Refresh user data after update
    existingUser = { ...existingUser, isGroupMember };

    // Check ban status
    if (existingUser.banStatus === "banned") {
      throw new Error("BAN_PERMANENT|Sua conta foi banida permanentemente. Entre em contato com @Danielssh no Telegram.");
    }
    if (existingUser.banStatus === "temp_banned" && existingUser.banExpiresAt && existingUser.banExpiresAt > new Date()) {
      const hoursLeft = Math.ceil((existingUser.banExpiresAt.getTime() - Date.now()) / (60 * 60 * 1000));
      throw new Error(`BAN_TEMP|Sua conta está temporariamente banida. Tempo restante: ${hoursLeft} hora(s).`);
    }

    const token = await createCustomToken(existingUser);
    return { user: existingUser, token, isNewUser: false };
  }

  // 5. Create new user with Telegram data
  // Generate a unique username based on Telegram username or ID
  const username = telegramUsername || `tg_${telegramId}`;

  // Generate a random password hash (user won't use password login, but field is required)
  const randomPassword = crypto.randomBytes(32).toString("hex");
  const passwordHash = await hashPassword(randomPassword);

  const newUser = await createCustomUser({
    username,
    passwordHash,
    displayName,
    isGroupMember, // Based on actual group membership check
  });

  // Link Telegram data to the new user
  await updateCustomUserTelegram(newUser.id, {
    telegramId,
    telegramUsername,
    telegramFirstName: displayName,
    telegramPhotoUrl,
    telegramVerified: true,
  });

  // Re-fetch user with updated Telegram fields
  const { getCustomUserById } = await import("./db");
  const updatedUser = await getCustomUserById(newUser.id);
  const finalUser = updatedUser || newUser;

  const token = await createCustomToken(finalUser);
  return { user: finalUser, token, isNewUser: true };
}

/**
 * Telegram Bot - Deep Link Login + Group Verification System
 * 
 * Login flow (deep link):
 * 1. Frontend generates a login code via tRPC
 * 2. User clicks "Entrar com Telegram" which opens t.me/bot?start=login_CODE
 * 3. Bot receives /start login_CODE, confirms the user, stores their Telegram data
 * 4. Frontend polls to check if the code was confirmed
 * 5. Once confirmed, frontend redirects to /api/auth/telegram-code?code=CODE to set cookie
 * 
 * Registration verification flow (group-based):
 * 1. User enters their @username on the registration page
 * 2. Bot sends a message in the group with inline button "Confirmar Cadastro"
 * 3. Only the mentioned @username can click the button
 * 4. When clicked, bot sends a 6-digit code via private message
 * 5. User enters the code on the site to complete registration
 * 
 * Uses in-memory store for codes (they expire after 5 minutes)
 */
import crypto from "crypto";

// =============================================
// Login Codes (deep link flow)
// =============================================

interface LoginCode {
  code: string;
  createdAt: number;
  confirmed: boolean;
  telegramId?: string;
  telegramUsername?: string;
  telegramFirstName?: string;
  telegramPhotoUrl?: string;
}

// In-memory store for login codes (expires after 5 min)
const loginCodes = new Map<string, LoginCode>();

// =============================================
// Verification Codes (registration flow)
// =============================================

interface VerificationEntry {
  telegramUsername: string; // without @
  code: string; // 6-digit code
  createdAt: number;
  confirmed: boolean; // code was generated and sent to user
  telegramId?: string;
  telegramFirstName?: string;
  groupMessageId?: number; // to edit the group message after confirmation
}

// In-memory store for verification entries
const verificationEntries = new Map<string, VerificationEntry>(); // key = telegramUsername (lowercase)
const verificationCodes = new Map<string, string>(); // key = 6-digit code -> telegramUsername

// Cleanup expired entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [code, data] of Array.from(loginCodes.entries())) {
    if (now - data.createdAt > 5 * 60 * 1000) {
      loginCodes.delete(code);
    }
  }
  for (const [username, entry] of Array.from(verificationEntries.entries())) {
    if (now - entry.createdAt > 10 * 60 * 1000) {
      verificationEntries.delete(username);
      if (entry.code) verificationCodes.delete(entry.code);
    }
  }
}, 60 * 1000);

// =============================================
// Login Code Functions
// =============================================

export function generateLoginCode(): string {
  const code = crypto.randomBytes(16).toString("hex");
  loginCodes.set(code, {
    code,
    createdAt: Date.now(),
    confirmed: false,
  });
  return code;
}

export function checkLoginCode(code: string): LoginCode | null {
  const data = loginCodes.get(code);
  if (!data) return null;
  if (Date.now() - data.createdAt > 5 * 60 * 1000) {
    loginCodes.delete(code);
    return null;
  }
  return data;
}

export function confirmLoginCode(code: string, telegramData: {
  telegramId: string;
  telegramUsername?: string;
  telegramFirstName?: string;
  telegramPhotoUrl?: string;
}): boolean {
  const data = loginCodes.get(code);
  if (!data) return false;
  if (Date.now() - data.createdAt > 5 * 60 * 1000) {
    loginCodes.delete(code);
    return false;
  }
  data.confirmed = true;
  data.telegramId = telegramData.telegramId;
  data.telegramUsername = telegramData.telegramUsername;
  data.telegramFirstName = telegramData.telegramFirstName;
  data.telegramPhotoUrl = telegramData.telegramPhotoUrl;
  loginCodes.set(code, data);
  return true;
}

export function consumeLoginCode(code: string): LoginCode | null {
  const data = loginCodes.get(code);
  if (!data || !data.confirmed) return null;
  loginCodes.delete(code);
  return data;
}

// =============================================
// Group Verification Functions
// =============================================

// EditStream Pro group chat ID
const EDITSTREAM_GROUP_CHAT_ID = "-1002240808163";

/**
 * Send a verification message to the group with an inline button.
 * Only the mentioned @username can click the button.
 */
export async function sendGroupVerification(
  telegramUsername: string,
  botToken: string
): Promise<{ success: boolean; error?: string }> {
  const usernameClean = telegramUsername.replace(/^@/, "").toLowerCase();
  
  // Check if there's already a pending verification
  const existing = verificationEntries.get(usernameClean);
  if (existing && Date.now() - existing.createdAt < 60 * 1000) {
    return { success: false, error: "Aguarde 1 minuto antes de solicitar novamente." };
  }

  try {
    const message = `🔐 @${usernameClean} está tentando se cadastrar no site EditStream Pro.\n\nClique no botão abaixo para confirmar que é você.`;
    
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: EDITSTREAM_GROUP_CHAT_ID,
        text: message,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [[
            {
              text: "✅ Confirmar Cadastro",
              callback_data: `verify_register_${usernameClean}`,
            },
          ]],
        },
      }),
    });

    const data = await res.json();
    
    if (!data.ok) {
      console.error("[TelegramBot] sendGroupVerification failed:", data.description);
      return { success: false, error: "Falha ao enviar mensagem no grupo. Tente novamente." };
    }

    // Store verification entry
    verificationEntries.set(usernameClean, {
      telegramUsername: usernameClean,
      code: "", // will be set when user clicks the button
      createdAt: Date.now(),
      confirmed: false,
      groupMessageId: data.result?.message_id,
    });

    console.log(`[TelegramBot] Verification message sent for @${usernameClean}, messageId: ${data.result?.message_id}`);
    return { success: true };
  } catch (err) {
    console.error("[TelegramBot] sendGroupVerification error:", err);
    return { success: false, error: "Erro de conexão. Tente novamente." };
  }
}

/**
 * Process callback_query from inline button click.
 * Verifies the clicker is the correct user, generates a 6-digit code,
 * and sends it via private message.
 */
export async function processCallbackQuery(
  callbackQuery: any,
  botToken: string
): Promise<void> {
  const data = callbackQuery.data;
  const from = callbackQuery.from;
  const fromUsername = (from.username || "").toLowerCase();
  const callbackQueryId = callbackQuery.id;

  console.log("[processCallbackQuery] Received callback:", { data, fromUsername, callbackQueryId });

  if (!data?.startsWith("verify_register_")) {
    console.log("[processCallbackQuery] Invalid callback data:", data);
    await answerCallbackQuery(callbackQueryId, "Ação inválida.", botToken);
    return;
  }

  const targetUsername = data.replace("verify_register_", "").toLowerCase();

  // Check if the person who clicked is the correct user
  if (fromUsername !== targetUsername) {
    console.log("[processCallbackQuery] Wrong user clicked:", { fromUsername, targetUsername });
    await answerCallbackQuery(
      callbackQueryId,
      "❌ Este botão é exclusivo para @" + targetUsername + ". Só o dono pode confirmar.",
      botToken,
      true
    );
    return;
  }

  // Check if verification entry exists
  const entry = verificationEntries.get(targetUsername);
  if (!entry) {
    console.log("[processCallbackQuery] No verification entry found for:", targetUsername);
    await answerCallbackQuery(callbackQueryId, "❌ Verificação expirada. Solicite novamente no site.", botToken, true);
    return;
  }

  console.log("[processCallbackQuery] Entry found, generating code...");

  // Check expiry (10 minutes)
  if (Date.now() - entry.createdAt > 10 * 60 * 1000) {
    verificationEntries.delete(targetUsername);
    await answerCallbackQuery(callbackQueryId, "❌ Verificação expirada. Solicite novamente no site.", botToken, true);
    return;
  }

  // Generate 6-digit code
  const code = String(Math.floor(100000 + Math.random() * 900000));
  
  // Update entry
  entry.code = code;
  entry.confirmed = true;
  entry.telegramId = String(from.id);
  entry.telegramFirstName = from.first_name;
  verificationEntries.set(targetUsername, entry);
  verificationCodes.set(code, targetUsername);

  // Answer the callback query
  console.log("[processCallbackQuery] Answering callback query with success message");
  await answerCallbackQuery(callbackQueryId, "✅ Identidade confirmada! Verifique sua DM.", botToken);

  // Send code via private message (monospace format)
  console.log("[processCallbackQuery] Sending code to user:", from.id);
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: from.id,
        text: `🔐 Seu código de verificação para o EditStream Pro:\n\n<code>${code}</code>\n\nCopie e cole no site para finalizar o cadastro.\n⏰ O código expira em 10 minutos.`,
        parse_mode: "HTML",
      }),
    });
    console.log("[processCallbackQuery] Code sent successfully");
  } catch (err) {
    console.error("[TelegramBot] Failed to send verification code DM:", err);
  }

  // Delete the group message after confirmation
  if (entry.groupMessageId) {
    try {
      await fetch(`https://api.telegram.org/bot${botToken}/deleteMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: EDITSTREAM_GROUP_CHAT_ID,
          message_id: entry.groupMessageId,
        }),
      });
    } catch (err) {
      console.error("[TelegramBot] Failed to delete group message:", err);
    }
  }

  console.log(`[TelegramBot] Verification code ${code} sent to @${targetUsername} (ID: ${from.id})`);
}

/**
 * Verify a 6-digit code entered by the user on the site.
 * Returns the verification data if valid.
 */
export function verifyRegistrationCode(code: string): {
  valid: boolean;
  telegramUsername?: string;
  telegramId?: string;
  telegramFirstName?: string;
} {
  const username = verificationCodes.get(code);
  if (!username) {
    return { valid: false };
  }

  const entry = verificationEntries.get(username);
  if (!entry || !entry.confirmed) {
    return { valid: false };
  }

  // Check expiry
  if (Date.now() - entry.createdAt > 10 * 60 * 1000) {
    verificationEntries.delete(username);
    verificationCodes.delete(code);
    return { valid: false };
  }

  return {
    valid: true,
    telegramUsername: entry.telegramUsername,
    telegramId: entry.telegramId,
    telegramFirstName: entry.telegramFirstName,
  };
}

/**
 * Consume a verification code (delete after use during registration)
 */
export function consumeVerificationCode(code: string): {
  valid: boolean;
  telegramUsername?: string;
  telegramId?: string;
  telegramFirstName?: string;
} {
  const result = verifyRegistrationCode(code);
  if (result.valid && result.telegramUsername) {
    verificationEntries.delete(result.telegramUsername.toLowerCase());
    verificationCodes.delete(code);
  }
  return result;
}

// =============================================
// Webhook Processing
// =============================================

/**
 * Process Telegram webhook update (handles /start command and callback_query)
 */
export async function processWebhookUpdate(update: any, botToken: string): Promise<string | null> {
  // Handle callback_query (inline button clicks)
  if (update.callback_query) {
    console.log("[processWebhookUpdate] Handling callback_query:", update.callback_query.data);
    await processCallbackQuery(update.callback_query, botToken);
    return null;
  }

  if (!update.message?.text) return null;
  
  const text = update.message.text;
  const chatId = update.message.chat.id;
  const from = update.message.from;
  
  // Handle /start login_CODE
  if (text.startsWith("/start login_")) {
    const code = text.replace("/start login_", "").trim();
    
    if (!code) {
      await sendTelegramMessage(chatId, "❌ Código de login inválido. Tente gerar um novo código no site.", botToken);
      return null;
    }
    
    const confirmed = confirmLoginCode(code, {
      telegramId: String(from.id),
      telegramUsername: from.username,
      telegramFirstName: from.first_name,
      telegramPhotoUrl: undefined,
    });
    
    if (confirmed) {
      const name = from.first_name || from.username || "Usuário";
      await sendTelegramMessage(
        chatId,
        `✅ Login confirmado, ${name}!\n\nCódigo: <code>${code.substring(0, 8)}</code>\n\nVocê pode voltar ao site. Sua conta será conectada automaticamente.`,
        botToken
      );
      return code;
    } else {
      await sendTelegramMessage(
        chatId,
        "❌ Código expirado ou inválido. Tente novamente no site.",
        botToken
      );
      return null;
    }
  }
  
  // Handle plain /start
  if (text === "/start") {
    await sendTelegramMessage(
      chatId,
      "👋 Bem-vindo ao EditStream Pro!\n\nUse o botão \"Entrar com Telegram\" no site para fazer login.",
      botToken
    );
    return null;
  }
  
  return null;
}

// =============================================
// Helper Functions
// =============================================

/**
 * Send a message via Telegram Bot API
 */
async function sendTelegramMessage(chatId: number | string, text: string, botToken: string): Promise<void> {
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
  } catch (err) {
    console.error("[TelegramBot] Failed to send message:", err);
  }
}

/**
 * Answer a callback query
 */
async function answerCallbackQuery(
  callbackQueryId: string,
  text: string,
  botToken: string,
  showAlert = false
): Promise<void> {
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
        show_alert: showAlert,
      }),
    });
  } catch (err) {
    console.error("[TelegramBot] Failed to answer callback query:", err);
  }
}

/**
 * Set webhook URL for the bot
 */
export async function setTelegramWebhook(webhookUrl: string, botToken: string): Promise<boolean> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: webhookUrl }),
    });
    const data = await res.json();
    console.log("[TelegramBot] setWebhook result:", data);
    return data.ok === true;
  } catch (err) {
    console.error("[TelegramBot] Failed to set webhook:", err);
    return false;
  }
}

/**
 * Check if a Telegram user is a member of the EditStream Pro group
 */
export async function checkGroupMembership(
  telegramUserId: string | number,
  botToken: string
): Promise<{ isMember: boolean; status: string }> {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/getChatMember`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: EDITSTREAM_GROUP_CHAT_ID,
          user_id: Number(telegramUserId),
        }),
      }
    );
    const data = await res.json();
    
    if (!data.ok) {
      console.error("[TelegramBot] getChatMember failed:", data.description);
      return { isMember: false, status: "unknown" };
    }
    
    const status = data.result.status;
    const isMember = ["creator", "administrator", "member", "restricted"].includes(status);
    
    console.log(`[TelegramBot] User ${telegramUserId} group status: ${status} (isMember: ${isMember})`);
    return { isMember, status };
  } catch (err) {
    console.error("[TelegramBot] Failed to check group membership:", err);
    return { isMember: false, status: "error" };
  }
}

/**
 * Get the group invite link
 */
export function getGroupInviteLink(): string {
  return "https://t.me/editstreampro";
}

/**
 * Get user profile photos from Telegram
 */
export async function getTelegramUserPhoto(userId: number, botToken: string): Promise<string | undefined> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/getUserProfilePhotos?user_id=${userId}&limit=1`);
    const data = await res.json();
    if (data.ok && data.result.total_count > 0) {
      const fileId = data.result.photos[0][0].file_id;
      const fileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
      const fileData = await fileRes.json();
      if (fileData.ok) {
        return `https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`;
      }
    }
  } catch (err) {
    console.error("[TelegramBot] Failed to get user photo:", err);
  }
  return undefined;
}

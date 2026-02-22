import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import {
  globalRateLimiter,
  authRateLimiter,
  webhookRateLimiter,
  downloadRateLimiter,
  applyHelmet,
  sanitizeMiddleware,
  blockSuspiciousRequests,
} from "../security";
import { getPaymentDetails } from "../mercadopago";
import { getOrderByExternalRef, updateOrderStatus, getCustomUserByTelegramId, createCustomUser, updateCustomUserTelegram } from "../db";
import { processTelegramLogin, type TelegramLoginData } from "../telegramAuth";
import { CUSTOM_COOKIE_NAME, createCustomToken, hashPassword } from "../customAuth";
import { consumeLoginCode, setTelegramWebhook } from "../telegramBot";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) return port;
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Trust proxy (behind reverse proxy in production)
  app.set("trust proxy", 1);

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // ===== TELEGRAM BOT WEBHOOK (BEFORE SECURITY MIDDLEWARE) =====
  // This must be before rate limiters to avoid 403 errors
  app.post("/api/webhooks/telegram", express.json(), async (req, res) => {
    try {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (!botToken) {
        console.warn("[Telegram Webhook] TELEGRAM_BOT_TOKEN not configured");
        return res.status(200).json({ ok: true });
      }

      console.log("[Telegram Webhook] Received update");
      if (req.body.callback_query) {
        console.log("[Telegram Webhook] Processing callback_query:", req.body.callback_query.data);
      }

      const { processWebhookUpdate } = await import("../telegramBot");
      await processWebhookUpdate(req.body, botToken);
      return res.status(200).json({ ok: true });
    } catch (error: any) {
      console.error("[Telegram Webhook] Error:", error.message, error.stack);
      return res.status(200).json({ ok: true });
    }
  });

  // ===== SECURITY MIDDLEWARE =====
  applyHelmet(app);
  app.use(blockSuspiciousRequests);
  app.use(globalRateLimiter);
  app.use(sanitizeMiddleware);

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // ===== TELEGRAM LOGIN WIDGET CALLBACK =====
  app.get("/api/auth/telegram", authRateLimiter, async (req, res) => {
    try {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (!botToken) {
        console.error("[Telegram Auth] TELEGRAM_BOT_TOKEN not configured");
        return res.redirect("/?error=telegram_not_configured");
      }

      const data: TelegramLoginData = {
        id: req.query.id as string,
        first_name: req.query.first_name as string | undefined,
        last_name: req.query.last_name as string | undefined,
        username: req.query.username as string | undefined,
        photo_url: req.query.photo_url as string | undefined,
        auth_date: req.query.auth_date as string,
        hash: req.query.hash as string,
      };

      if (!data.id || !data.auth_date || !data.hash) {
        return res.redirect("/?error=invalid_telegram_data");
      }

      const { user, token, isNewUser } = await processTelegramLogin(data, botToken);

      // Set session cookie
      const isSecure = req.protocol === "https" || req.headers["x-forwarded-proto"] === "https";
      res.cookie(CUSTOM_COOKIE_NAME, token, {
        httpOnly: true,
        secure: isSecure,
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: "/",
      });

      // Redirect to frontend with success
      const redirectUrl = isNewUser ? "/?telegram_login=new" : "/?telegram_login=success";
      return res.redirect(redirectUrl);
    } catch (error: any) {
      console.error("[Telegram Auth] Error:", error.message);
      const errorMsg = encodeURIComponent(error.message || "Erro ao fazer login com Telegram");
      return res.redirect(`/login?error=${errorMsg}`);
    }
  });

  // ===== TELEGRAM DEEP LINK LOGIN (code-based) =====
  app.get("/api/auth/telegram-code", authRateLimiter, async (req, res) => {
    try {
      const code = req.query.code as string;
      if (!code) return res.redirect("/login?error=C%C3%B3digo%20inv%C3%A1lido");

      const loginData = consumeLoginCode(code);
      if (!loginData || !loginData.telegramId) {
        return res.redirect("/login?error=C%C3%B3digo%20expirado%20ou%20inv%C3%A1lido");
      }

      // Check group membership via Telegram API
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      let isGroupMember = false;
      if (botToken && loginData.telegramId) {
        try {
          const { checkGroupMembership } = await import("../telegramBot");
          const membership = await checkGroupMembership(loginData.telegramId, botToken);
          isGroupMember = membership.isMember;
          console.log(`[Telegram Code Auth] User ${loginData.telegramId} group: ${isGroupMember} (${membership.status})`);
        } catch (err) {
          console.error("[Telegram Code Auth] Group check failed:", err);
        }
      }

      // Find or create user by Telegram ID
      let user = await getCustomUserByTelegramId(loginData.telegramId);

      if (!user) {
        // Create new user
        const username = loginData.telegramUsername || `tg_${loginData.telegramId}`;
        const crypto = await import("crypto");
        const randomPassword = crypto.randomBytes(32).toString("hex");
        const passwordHash = await hashPassword(randomPassword);
        const displayName = loginData.telegramFirstName || username;

        user = await createCustomUser({
          username,
          passwordHash,
          displayName,
          isGroupMember,
        });

        await updateCustomUserTelegram(user.id, {
          telegramId: loginData.telegramId,
          telegramUsername: loginData.telegramUsername,
          telegramFirstName: displayName,
          telegramPhotoUrl: loginData.telegramPhotoUrl,
          telegramVerified: true,
          isGroupMember,
        });
      } else {
        // Update existing user
        await updateCustomUserTelegram(user.id, {
          telegramId: loginData.telegramId,
          telegramUsername: loginData.telegramUsername,
          telegramFirstName: loginData.telegramFirstName || user.displayName || undefined,
          telegramPhotoUrl: loginData.telegramPhotoUrl,
          telegramVerified: true,
          isGroupMember,
        });
      }

      // Check ban
      if (user.banStatus === "banned") {
        return res.redirect("/login?error=Sua%20conta%20foi%20banida%20permanentemente");
      }
      if (user.banStatus === "temp_banned" && user.banExpiresAt && user.banExpiresAt > new Date()) {
        return res.redirect("/login?error=Sua%20conta%20est%C3%A1%20temporariamente%20banida");
      }

      const token = await createCustomToken(user);
      const isSecure = req.protocol === "https" || req.headers["x-forwarded-proto"] === "https";
      res.cookie(CUSTOM_COOKIE_NAME, token, {
        httpOnly: true,
        secure: isSecure,
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: "/",
      });

      return res.redirect("/?telegram_login=success");
    } catch (error: any) {
      console.error("[Telegram Code Auth] Error:", error.message);
      return res.redirect("/login?error=Erro%20ao%20fazer%20login");
    }
  });



  // ===== MERCADO PAGO WEBHOOK =====
  app.post("/api/webhooks/mercadopago", webhookRateLimiter, async (req, res) => {
    try {
      const { type, data } = req.body;

      if (type === "payment") {
        const paymentId = data?.id?.toString();
        if (!paymentId) {
          return res.status(400).json({ error: "Missing payment ID" });
        }

        const payment = await getPaymentDetails(paymentId);
        const externalRef = payment.external_reference;

        if (externalRef) {
          const order = await getOrderByExternalRef(externalRef);
          if (order) {
            let status: "approved" | "rejected" | "pending" = "pending";
            if (payment.status === "approved") status = "approved";
            else if (payment.status === "rejected" || payment.status === "cancelled") status = "rejected";

            await updateOrderStatus(
              order.id,
              status,
              paymentId,
              payment.payment_method_id || payment.payment_type_id
            );
            console.log(`[MercadoPago] Order ${order.id} updated to ${status}`);
          }
        }
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error("[MercadoPago Webhook] Error:", error);
      res.status(200).json({ received: true }); // Always return 200 to MP
    }
  });

  // ===== tRPC API =====
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);

    // Setup Telegram webhook in production
    if (process.env.NODE_ENV !== "development") {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (botToken) {
        // Use VITE_APP_TITLE to detect the domain, or fallback to known domain
        const webhookUrl = `https://streamvip.shop/api/webhooks/telegram`;
        setTelegramWebhook(webhookUrl, botToken)
          .then((ok) => console.log(`[Telegram] Webhook setup: ${ok ? "success" : "failed"}`))
          .catch((err) => console.error("[Telegram] Webhook setup error:", err));
      }
    }
  });
}

startServer().catch(console.error);

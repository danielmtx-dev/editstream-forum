/**
 * Security middleware for EditStream Pro
 * - Rate limiting (anti-DDoS/flood)
 * - Helmet security headers
 * - Brute force protection
 * - Request sanitization
 */
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import type { Express, Request, Response, NextFunction } from "express";

/** Global rate limiter: 100 requests per minute per IP */
export const globalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas requisições. Tente novamente em 1 minuto." },
});

/** Strict rate limiter for auth routes: 10 attempts per 15 minutes */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas de login. Tente novamente em 15 minutos." },
});

/** Very strict rate limiter for download routes: 30 per hour */
export const downloadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Limite de downloads atingido. Tente novamente mais tarde." },
});

/** Webhook rate limiter: 50 per minute (Mercado Pago notifications) */
export const webhookRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many webhook requests." },
});

/** Apply helmet security headers */
export function applyHelmet(app: Express) {
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }));
}

/** Sanitize request body to prevent XSS */
export function sanitizeMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === "object") {
    sanitizeObject(req.body);
  }
  next();
}

function sanitizeObject(obj: any) {
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === "string") {
      obj[key] = obj[key]
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
        .replace(/javascript:/gi, "");
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
}

/** Block suspicious user agents and common attack patterns */
export function blockSuspiciousRequests(req: Request, res: Response, next: NextFunction) {
  // Allow Telegram webhook without checking user agent
  if (req.path === "/api/webhooks/telegram") {
    return next();
  }

  const ua = req.headers["user-agent"] || "";

  const blockedPatterns = [
    /sqlmap/i, /nikto/i, /nessus/i, /openvas/i,
    /dirbuster/i, /gobuster/i, /wpscan/i,
  ];

  for (const pattern of blockedPatterns) {
    if (pattern.test(ua)) {
      return res.status(403).json({ error: "Forbidden" });
    }
  }

  if (req.path.includes("..") || req.path.includes("//")) {
    return res.status(400).json({ error: "Bad Request" });
  }

  next();
}

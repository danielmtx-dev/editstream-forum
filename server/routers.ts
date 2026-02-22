import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { nanoid } from "nanoid";
import { storagePut, storageGet } from "./storage";
import { TRPCError } from "@trpc/server";
import {
  registerUser, loginUser, getCurrentCustomUser,
  isAdmin, CUSTOM_COOKIE_NAME, ADMIN_USERNAME,
  verifyCustomToken, createCustomToken, hashPassword,
} from "./customAuth";
import { generateLoginCode, checkLoginCode, checkGroupMembership, getGroupInviteLink, sendGroupVerification, verifyRegistrationCode, consumeVerificationCode } from "./telegramBot";
import {
  createPaymentPreference, getPaymentDetails, isMercadoPagoConfigured,
} from "./mercadopago";
import {
  getAllCategories, getCategoryById, insertCategory, updateCategory, deleteCategory,
  getAllProducts, getProductsByCategory, getProductById, insertProduct, updateProduct, deleteProduct,
  incrementProductView, incrementProductDownload, getProductStats, getProductCountByCategory,
  getCustomUserById, getAllCustomUsers, updateCustomUserGroupMembership,
  updateCustomUserTelegram, updateCustomUserBanStatus, getCustomUserByTelegramId,
  deleteCustomUser, updateCustomUser,
  createOrder, getOrderById, getOrderByExternalRef, getOrdersByUser,
  getUserApprovedOrderForProduct, updateOrderStatus, incrementOrderDownload, getAllOrders,
  getProductImages, addProductImage, deleteProductImage,
  getProductFiles, addProductFile, deleteProductFile,
  getSetting, setSetting, getSettings,
  createForumThread, getForumThreadsByCategory, getForumThreadById,
  createForumComment, getForumCommentsByThread, toggleForumLike, getForumLikeCount,
} from "./db";
import type { CustomUser } from "../drizzle/schema";
import { createRole, getAllRoles, assignRoleToUser, removeRoleFromUser, getUserRoles, updateUserProfilePhoto } from "./db";

// ============================================
// Helper: get custom user from request context
// ============================================
async function getCustomUserFromCtx(ctx: any): Promise<CustomUser | null> {
  const user = await getCurrentCustomUser(ctx.req.headers.cookie);
  if (!user) return null;
  // Check ban status
  if (user.banStatus === "banned") return null;
  if (user.banStatus === "temp_banned" && user.banExpiresAt && user.banExpiresAt > new Date()) return null;
  // If temp ban expired, reset
  if (user.banStatus === "temp_banned" && user.banExpiresAt && user.banExpiresAt <= new Date()) {
    await updateCustomUserBanStatus(user.id, { banStatus: "active", banReason: undefined, banExpiresAt: null, isActive: true });
  }
  return user;
}

async function requireCustomUser(ctx: any): Promise<CustomUser> {
  const user = await getCustomUserFromCtx(ctx);
  if (!user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Faça login para continuar" });
  if (user.banStatus === "restricted") {
    // Restricted users can browse but not download/buy
  }
  return user;
}

async function requireAdmin(ctx: any): Promise<CustomUser> {
  const user = await requireCustomUser(ctx);
  if (!isAdmin(user)) throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito ao administrador" });
  return user;
}

export const appRouter = router({
  system: systemRouter,

  // Manus OAuth auth (keep for system compatibility)
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============================================
  // Custom Auth (email/phone + password)
  // ============================================
  customAuth: router({
    register: publicProcedure
      .input(z.object({
        username: z.string().min(3).max(128),
        password: z.string().min(6).max(128),
        verificationCode: z.string().length(6).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          // If verification code is provided, consume it and link Telegram data
          let telegramData: { telegramUsername?: string; telegramId?: string; telegramFirstName?: string } | null = null;
          if (input.verificationCode) {
            const verification = consumeVerificationCode(input.verificationCode);
            if (!verification.valid) {
              throw new TRPCError({ code: "BAD_REQUEST", message: "Código de verificação inválido ou expirado." });
            }
            telegramData = verification;
          }

          const { user, token } = await registerUser(input);
          ctx.res.cookie(CUSTOM_COOKIE_NAME, token, {
            httpOnly: true,
            secure: ctx.req.protocol === "https" || ctx.req.headers["x-forwarded-proto"] === "https",
            sameSite: "lax",
            maxAge: 30 * 24 * 60 * 60 * 1000,
            path: "/",
          });

          // If Telegram verification was done, link Telegram data to the user
          if (telegramData?.telegramId) {
            await updateCustomUserTelegram(user.id, {
              telegramId: telegramData.telegramId,
              telegramUsername: telegramData.telegramUsername,
              telegramFirstName: telegramData.telegramFirstName,
              telegramVerified: true,
              isGroupMember: true, // They confirmed from the group, so they're a member
            });
          }

          return {
            id: user.id, username: user.username, displayName: user.displayName,
            role: user.role, isGroupMember: telegramData ? true : user.isGroupMember,
            telegramVerified: telegramData ? true : user.telegramVerified, banStatus: user.banStatus,
          };
        } catch (err: any) {
          const msg = err?.message || "";
          const knownErrors = [
            "Nome de usu\u00e1rio j\u00e1 est\u00e1 em uso",
            "Este e-mail j\u00e1 est\u00e1 cadastrado",
            "Este telefone j\u00e1 est\u00e1 cadastrado",
            "Nome de usu\u00e1rio deve ter pelo menos",
            "Senha deve ter pelo menos",
            "Erro ao criar conta",
            "C\u00f3digo de verifica\u00e7\u00e3o inv\u00e1lido ou expirado.",
          ];
          const isKnown = knownErrors.some(e => msg.includes(e));
          if (isKnown) {
            throw new TRPCError({ code: "BAD_REQUEST", message: msg });
          }
          console.error("[register] Unexpected error:", msg);
          throw new TRPCError({ code: "BAD_REQUEST", message: "Erro ao criar conta. Tente novamente." });
        }
      }),

    /** Send Telegram verification message to the group */
    sendTelegramVerification: publicProcedure
      .input(z.object({
        telegramUsername: z.string().min(1).max(128),
      }))
      .mutation(async ({ input }) => {
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (!botToken) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Bot não configurado." });
        }
        const result = await sendGroupVerification(input.telegramUsername, botToken);
        if (!result.success) {
          throw new TRPCError({ code: "BAD_REQUEST", message: result.error || "Falha ao enviar verificação." });
        }
        return { success: true, message: "Mensagem enviada no grupo. Clique no botão para confirmar." };
      }),

    /** Verify the 6-digit code from Telegram */
    verifyTelegramCode: publicProcedure
      .input(z.object({
        code: z.string().length(6),
      }))
      .mutation(async ({ input }) => {
        const result = verifyRegistrationCode(input.code);
        if (!result.valid) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Código inválido ou expirado." });
        }
        return {
          valid: true,
          telegramUsername: result.telegramUsername,
          telegramFirstName: result.telegramFirstName,
        };
      }),

    login: publicProcedure
      .input(z.object({ login: z.string().min(1), password: z.string().min(1), rememberMe: z.boolean().optional() }))
      .mutation(async ({ input, ctx }) => {
        try {
          const { user, token } = await loginUser(input.login, input.password, input.rememberMe);
          const maxAge = input.rememberMe ? 90 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
          ctx.res.cookie(CUSTOM_COOKIE_NAME, token, {
            httpOnly: true,
            secure: ctx.req.protocol === "https" || ctx.req.headers["x-forwarded-proto"] === "https",
            sameSite: "lax",
            maxAge,
            path: "/",
          });
          return {
            id: user.id, username: user.username, displayName: user.displayName,
            role: user.role, isGroupMember: user.isGroupMember,
            telegramVerified: user.telegramVerified, banStatus: user.banStatus,
          };
        } catch (err: any) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: err.message });
        }
      }),

    me: publicProcedure.query(async ({ ctx }) => {
      const user = await getCustomUserFromCtx(ctx);
      if (!user) return null;
      return {
        id: user.id, username: user.username, displayName: user.displayName,
        email: user.email, phone: user.phone, role: user.role,
        isGroupMember: user.isGroupMember, telegramVerified: user.telegramVerified,
        telegramUsername: user.telegramUsername, telegramFirstName: user.telegramFirstName,
        telegramPhotoUrl: user.telegramPhotoUrl, banStatus: user.banStatus,
        banReason: user.banReason, banExpiresAt: user.banExpiresAt,
        createdAt: user.createdAt,
      };
    }),

    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(CUSTOM_COOKIE_NAME, { httpOnly: true, path: "/", sameSite: "lax" });
      return { success: true };
    }),

    /** Change password (requires current password) */
    changePassword: publicProcedure
      .input(z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(6).max(128),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await requireCustomUser(ctx);
        // Verify current password
        const { verifyPassword } = await import("./customAuth");
        const valid = await verifyPassword(input.currentPassword, user.passwordHash);
        if (!valid) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Senha atual incorreta" });
        }
        // Hash new password and update
        const newHash = await hashPassword(input.newPassword);
        await updateCustomUser(user.id, { passwordHash: newHash });
        return { success: true };
      }),

    /** Public members list */
    publicMembers: publicProcedure.query(async () => {
      const users = await getAllCustomUsers();
      return users
        .filter(u => u.isActive && u.banStatus !== "banned")
        .map(u => ({
          id: u.id, username: u.username, displayName: u.displayName,
          role: u.role, isGroupMember: u.isGroupMember,
          telegramVerified: u.telegramVerified, createdAt: u.createdAt,
        }));
    }),

    /** Generate Telegram login code for deep link flow */
    generateTelegramCode: publicProcedure
      .input(z.object({}))
      .mutation(async () => {
        const code = generateLoginCode();
        return { code };
      }),

    /** Check if Telegram login code has been confirmed */
    checkTelegramCode: publicProcedure
      .input(z.object({ code: z.string() }))
      .query(async ({ input }) => {
        const result = checkLoginCode(input.code);
        if (!result) return { confirmed: false };
        return { confirmed: result.confirmed };
      }),

    /** Re-check group membership via Telegram API */
    recheckGroupMembership: publicProcedure
      .mutation(async ({ ctx }) => {
        const user = await requireCustomUser(ctx);
        if (!user.telegramId) {
          return { isMember: false, status: "no_telegram", groupLink: getGroupInviteLink() };
        }
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (!botToken) {
          return { isMember: user.isGroupMember ?? false, status: "bot_not_configured", groupLink: getGroupInviteLink() };
        }
        try {
          const result = await checkGroupMembership(user.telegramId, botToken);
          // Update in database
          await updateCustomUserGroupMembership(user.id, result.isMember);
          return { isMember: result.isMember, status: result.status, groupLink: getGroupInviteLink() };
        } catch (err) {
          console.error("[recheckGroupMembership] Error:", err);
          return { isMember: user.isGroupMember ?? false, status: "error", groupLink: getGroupInviteLink() };
        }
      }),

    /** Link Telegram account to current user */
    linkTelegram: publicProcedure
      .input(z.object({
        telegramId: z.string(),
        telegramUsername: z.string().optional(),
        telegramFirstName: z.string().optional(),
        telegramPhotoUrl: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await requireCustomUser(ctx);
        // Check if telegram already linked to another account
        const existing = await getCustomUserByTelegramId(input.telegramId);
        if (existing && existing.id !== user.id) {
          throw new TRPCError({ code: "CONFLICT", message: "Este Telegram já está vinculado a outra conta" });
        }
        await updateCustomUserTelegram(user.id, {
          telegramId: input.telegramId,
          telegramUsername: input.telegramUsername,
          telegramFirstName: input.telegramFirstName,
          telegramPhotoUrl: input.telegramPhotoUrl,
          telegramVerified: true,
        });
        return { success: true };
      }),
  }),

  // ============================================
  // Categories
  // ============================================
  categories: router({
    list: publicProcedure.query(async () => getAllCategories(true)),
    listAll: publicProcedure.query(async ({ ctx }) => {
      await requireAdmin(ctx);
      return getAllCategories(false);
    }),
    create: publicProcedure
      .input(z.object({
        name: z.string().min(1).max(256),
        slug: z.string().min(1).max(256),
        icon: z.string().max(64).default("📦"),
        description: z.string().max(2000).optional(),
        sortOrder: z.number().default(0),
        isActive: z.boolean().default(true),
      }))
      .mutation(async ({ input, ctx }) => {
        await requireAdmin(ctx);
        return insertCategory(input);
      }),
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(256).optional(),
        slug: z.string().min(1).max(256).optional(),
        icon: z.string().max(64).optional(),
        description: z.string().max(2000).optional(),
        sortOrder: z.number().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await requireAdmin(ctx);
        const { id, ...data } = input;
        return updateCategory(id, data);
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await requireAdmin(ctx);
        await deleteCategory(input.id);
        return { success: true };
      }),
  }),

  // ============================================
  // Products
  // ============================================
  products: router({
    /** Public: list active products (NEVER includes fileUrl/fileKey) */
    list: publicProcedure
      .input(z.object({ categoryId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        let prods;
        if (input?.categoryId) {
          prods = await getProductsByCategory(input.categoryId, true);
        } else {
          prods = await getAllProducts(true);
        }
        return prods.map(p => ({ ...p, fileUrl: null, fileKey: null }));
      }),

    listAll: publicProcedure
      .input(z.object({ categoryId: z.number().optional() }).optional())
      .query(async ({ input, ctx }) => {
        await requireAdmin(ctx);
        if (input?.categoryId) return getProductsByCategory(input.categoryId, false);
        return getAllProducts(false);
      }),

    /** Public: get product by ID (strips file info, includes images/files metadata) */
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const p = await getProductById(input.id);
        if (!p) return null;
        const images = await getProductImages(p.id);
        const files = await getProductFiles(p.id);
        // Strip file URLs from files list - only show metadata
        const safeFiles = files.map(f => ({
          id: f.id, productId: f.productId, fileName: f.fileName,
          fileSize: f.fileSize, fileMimeType: f.fileMimeType, sortOrder: f.sortOrder,
        }));
        return {
          ...p, fileUrl: null, fileKey: p.fileKey ? true : null,
          fileName: p.fileKey ? p.fileName : null,
          fileSize: p.fileKey ? p.fileSize : null,
          images, files: safeFiles,
          externalLinks: p.externalLinks ? JSON.parse(p.externalLinks) : [],
        };
      }),

    counts: publicProcedure.query(async () => getProductCountByCategory()),

    stats: publicProcedure.query(async ({ ctx }) => {
      await requireAdmin(ctx);
      return getProductStats();
    }),

    /** Admin: create product */
    create: publicProcedure
      .input(z.object({
        title: z.string().min(1).max(512),
        description: z.string().min(1),
        priceCents: z.number().min(0).default(0),
        isFree: z.boolean().default(false),
        categoryId: z.number(),
        paymentMethods: z.string().default("pix"),
        pixKey: z.string().max(512).optional(),
        paymentInstructions: z.string().optional(),
        externalLinks: z.string().optional(), // JSON string
        isPinned: z.boolean().default(false),
        isActive: z.boolean().default(true),
        imageData: z.string().optional(),
        imageMimeType: z.string().optional(),
        fileData: z.string().optional(),
        fileMimeType: z.string().optional(),
        fileName: z.string().optional(),
        fileSize: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const admin = await requireAdmin(ctx);
        let imageUrl: string | null = null;
        let imageKey: string | null = null;
        let fileUrl: string | null = null;
        let fileKey: string | null = null;

        if (input.imageData && input.imageMimeType) {
          const buffer = Buffer.from(input.imageData, "base64");
          const ext = input.imageMimeType.split("/")[1] || "jpg";
          const key = `products/images/${nanoid(16)}.${ext}`;
          const result = await storagePut(key, buffer, input.imageMimeType);
          imageUrl = result.url;
          imageKey = result.key;
        }

        if (input.fileData && input.fileMimeType && input.fileName) {
          const buffer = Buffer.from(input.fileData, "base64");
          const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
          const key = `products/protected/${nanoid(24)}/${safeName}`;
          const result = await storagePut(key, buffer, input.fileMimeType);
          fileUrl = result.url;
          fileKey = result.key;
        }

        return insertProduct({
          title: input.title,
          description: input.description,
          priceCents: input.priceCents,
          isFree: input.isFree,
          categoryId: input.categoryId,
          imageUrl, imageKey, fileUrl, fileKey,
          fileName: input.fileName || null,
          fileSize: input.fileSize || null,
          paymentMethods: input.paymentMethods,
          pixKey: input.pixKey || null,
          paymentInstructions: input.paymentInstructions || null,
          externalLinks: input.externalLinks || null,
          isPinned: input.isPinned,
          isActive: input.isActive,
          createdById: admin.id,
        });
      }),

    /** Admin: update product */
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).max(512).optional(),
        description: z.string().optional(),
        priceCents: z.number().min(0).optional(),
        isFree: z.boolean().optional(),
        categoryId: z.number().optional(),
        paymentMethods: z.string().optional(),
        pixKey: z.string().max(512).optional(),
        paymentInstructions: z.string().optional(),
        externalLinks: z.string().optional(),
        isPinned: z.boolean().optional(),
        isActive: z.boolean().optional(),
        imageData: z.string().optional(),
        imageMimeType: z.string().optional(),
        fileData: z.string().optional(),
        fileMimeType: z.string().optional(),
        fileName: z.string().optional(),
        fileSize: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await requireAdmin(ctx);
        const { id, imageData, imageMimeType, fileData, fileMimeType, ...data } = input;

        if (imageData && imageMimeType) {
          const buffer = Buffer.from(imageData, "base64");
          const ext = imageMimeType.split("/")[1] || "jpg";
          const key = `products/images/${nanoid(16)}.${ext}`;
          const result = await storagePut(key, buffer, imageMimeType);
          (data as any).imageUrl = result.url;
          (data as any).imageKey = result.key;
        }

        if (fileData && fileMimeType && data.fileName) {
          const buffer = Buffer.from(fileData, "base64");
          const safeName = data.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
          const key = `products/protected/${nanoid(24)}/${safeName}`;
          const result = await storagePut(key, buffer, fileMimeType);
          (data as any).fileUrl = result.url;
          (data as any).fileKey = result.key;
        }

        return updateProduct(id, data);
      }),

    /** Admin: add additional image to product */
    addImage: publicProcedure
      .input(z.object({
        productId: z.number(),
        imageData: z.string(),
        imageMimeType: z.string(),
        sortOrder: z.number().default(0),
      }))
      .mutation(async ({ input, ctx }) => {
        await requireAdmin(ctx);
        const buffer = Buffer.from(input.imageData, "base64");
        const ext = input.imageMimeType.split("/")[1] || "jpg";
        const key = `products/images/${nanoid(16)}.${ext}`;
        const result = await storagePut(key, buffer, input.imageMimeType);
        return addProductImage({
          productId: input.productId,
          imageUrl: result.url,
          imageKey: result.key,
          sortOrder: input.sortOrder,
        });
      }),

    /** Admin: delete product image */
    deleteImage: publicProcedure
      .input(z.object({ imageId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await requireAdmin(ctx);
        await deleteProductImage(input.imageId);
        return { success: true };
      }),

    /** Admin: add additional file to product */
    addFile: publicProcedure
      .input(z.object({
        productId: z.number(),
        fileData: z.string(),
        fileMimeType: z.string(),
        fileName: z.string(),
        fileSize: z.number(),
        sortOrder: z.number().default(0),
      }))
      .mutation(async ({ input, ctx }) => {
        await requireAdmin(ctx);
        const buffer = Buffer.from(input.fileData, "base64");
        const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
        const key = `products/protected/${nanoid(24)}/${safeName}`;
        const result = await storagePut(key, buffer, input.fileMimeType);
        return addProductFile({
          productId: input.productId,
          fileUrl: result.url,
          fileKey: result.key,
          fileName: input.fileName,
          fileSize: input.fileSize,
          fileMimeType: input.fileMimeType,
          sortOrder: input.sortOrder,
        });
      }),

    /** Admin: delete product file */
    deleteFile: publicProcedure
      .input(z.object({ fileId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await requireAdmin(ctx);
        await deleteProductFile(input.fileId);
        return { success: true };
      }),

    /** Get images for a product (public) */
    getImages: publicProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ input }) => getProductImages(input.productId)),

    /** Get files for a product (public - shows metadata only) */
    getFiles: publicProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ input }) => getProductFiles(input.productId)),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await requireAdmin(ctx);
        await deleteProduct(input.id);
        return { success: true };
      }),

    trackView: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await incrementProductView(input.id);
        return { success: true };
      }),
  }),

  // ============================================
  // Protected Downloads
  // ============================================
  downloads: router({
    requestDownload: publicProcedure
      .input(z.object({ productId: z.number(), fileId: z.number().optional() }))
      .mutation(async ({ input, ctx }) => {
        const user = await requireCustomUser(ctx);
        if (user.banStatus === "restricted") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Sua conta está restrita. Contate o administrador." });
        }

        const product = await getProductById(input.productId);
        if (!product || !product.isActive) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Produto não encontrado" });
        }

        // Determine which file to download
        let fileKey: string | null = null;
        let fileName: string = "download";

        if (input.fileId) {
          // Download specific file from productFiles
          const files = await getProductFiles(product.id);
          const file = files.find(f => f.id === input.fileId);
          if (!file) throw new TRPCError({ code: "NOT_FOUND", message: "Arquivo não encontrado" });
          fileKey = file.fileKey;
          fileName = file.fileName;
        } else {
          // Download main file
          fileKey = product.fileKey;
          fileName = product.fileName || "download";
        }

        if (!fileKey) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Este produto não possui arquivo para download" });
        }

        if (product.isFree) {
          if (!user.isGroupMember && !isAdmin(user)) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Você precisa ser membro do grupo para baixar produtos gratuitos. Conecte seu Telegram e confirme sua participação.",
            });
          }
        } else {
          if (!isAdmin(user)) {
            const order = await getUserApprovedOrderForProduct(user.id, product.id);
            if (!order) {
              throw new TRPCError({ code: "FORBIDDEN", message: "Você precisa comprar este produto antes de fazer o download." });
            }
            if (order.downloadCount >= order.maxDownloads) {
              throw new TRPCError({ code: "FORBIDDEN", message: `Limite de downloads atingido (${order.maxDownloads}). Contate o administrador.` });
            }
            await incrementOrderDownload(order.id);
          }
        }

        const { url } = await storageGet(fileKey);
        await incrementProductDownload(product.id);

        return { downloadUrl: url, fileName, expiresIn: 300 };
      }),

    canDownload: publicProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ input, ctx }) => {
        const user = await getCustomUserFromCtx(ctx);
        if (!user) return { canDownload: false, reason: "login_required" };
        if (user.banStatus === "restricted") return { canDownload: false, reason: "restricted" };

        const product = await getProductById(input.productId);
        if (!product) return { canDownload: false, reason: "no_file" };
        // Check if product has any downloadable content
        const hasMainFile = !!product.fileKey;
        const files = await getProductFiles(input.productId);
        const hasExternalLinks = product.externalLinks && typeof product.externalLinks === "string" && product.externalLinks.length > 2;
        if (!hasMainFile && files.length === 0 && !hasExternalLinks) {
          return { canDownload: false, reason: "no_file" };
        }

        if (isAdmin(user)) return { canDownload: true, reason: "admin" };

        if (product!.isFree) {
          // Re-verify group membership via Telegram API if user has telegramId
          let currentMember = user.isGroupMember ?? false;
          if (user.telegramId) {
            const botToken = process.env.TELEGRAM_BOT_TOKEN;
            if (botToken) {
              try {
                const membership = await checkGroupMembership(user.telegramId, botToken);
                currentMember = membership.isMember;
                // Update in DB if changed
                if (currentMember !== user.isGroupMember) {
                  await updateCustomUserGroupMembership(user.id, currentMember);
                }
              } catch (err) {
                console.error("[canDownload] Group check failed, using cached value:", err);
              }
            }
          }
          if (!currentMember) return { canDownload: false, reason: "group_required", groupLink: "https://t.me/editstreampro" };
          return { canDownload: true, reason: "free_group_member" };
        }

        const order = await getUserApprovedOrderForProduct(user.id, input.productId);
        if (!order) return { canDownload: false, reason: "payment_required" };
        if (order.downloadCount >= order.maxDownloads) return { canDownload: false, reason: "download_limit" };
        // Determine payment method for display
        const paymentMethod = order.paymentMethod || "unknown";
        const reason = paymentMethod === "manual" ? "admin_granted" : "paid";
        return { canDownload: true, reason, paymentMethod };
      }),
  }),

  // ============================================
  // Orders / Payments (Mercado Pago - PIX only)
  // ============================================
  orders: router({
    createPayment: publicProcedure
      .input(z.object({
        productId: z.number(),
        origin: z.string(),
        paymentMethod: z.enum(["pix", "boleto", "card", "all"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await requireCustomUser(ctx);
        if (user.banStatus === "restricted") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Sua conta está restrita." });
        }

        const product = await getProductById(input.productId);
        if (!product || !product.isActive) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Produto não encontrado" });
        }
        if (product.isFree) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Este produto é gratuito" });
        }

        const existingOrder = await getUserApprovedOrderForProduct(user.id, product.id);
        if (existingOrder) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Você já comprou este produto" });
        }

        const mpConfigured = await isMercadoPagoConfigured();
        if (!mpConfigured) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Sistema de pagamento não configurado" });
        }

        const externalRef = `ES-${nanoid(16)}`;
        const order = await createOrder({
          userId: user.id,
          productId: product.id,
          amountCents: product.priceCents,
          status: "pending",
          externalReference: externalRef,
        });

        const origin = input.origin;
        const preference = await createPaymentPreference({
          title: product.title,
          description: product.description.substring(0, 256),
          priceCents: product.priceCents,
          externalReference: externalRef,
          backUrls: {
            success: `${origin}/pagamento/sucesso?order=${order.id}`,
            failure: `${origin}/pagamento/falha?order=${order.id}`,
            pending: `${origin}/pagamento/pendente?order=${order.id}`,
          },
          notificationUrl: `${origin}/api/webhooks/mercadopago`,
          paymentMethod: input.paymentMethod || "all",
        });

        return {
          orderId: order.id,
          preferenceId: preference.id,
          initPoint: preference.init_point,
          sandboxInitPoint: preference.sandbox_init_point,
        };
      }),

    myOrders: publicProcedure.query(async ({ ctx }) => {
      const user = await requireCustomUser(ctx);
      return getOrdersByUser(user.id);
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const user = await requireCustomUser(ctx);
        const order = await getOrderById(input.id);
        if (!order) throw new TRPCError({ code: "NOT_FOUND" });
        if (order.userId !== user.id && !isAdmin(user)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return order;
      }),

    listAll: publicProcedure.query(async ({ ctx }) => {
      await requireAdmin(ctx);
      return getAllOrders();
    }),
  }),

  // ============================================
  // Admin: User Management + Settings
  // ============================================
  admin: router({
    users: publicProcedure.query(async ({ ctx }) => {
      await requireAdmin(ctx);
      const users = await getAllCustomUsers();
      return users.map(u => ({
        id: u.id, username: u.username, email: u.email, phone: u.phone,
        displayName: u.displayName, role: u.role,
        isGroupMember: u.isGroupMember, isActive: u.isActive,
        banStatus: u.banStatus, banReason: u.banReason, banExpiresAt: u.banExpiresAt,
        telegramId: u.telegramId, telegramUsername: u.telegramUsername,
        telegramVerified: u.telegramVerified, telegramPhotoUrl: u.telegramPhotoUrl,
        createdAt: u.createdAt, lastSignedIn: u.lastSignedIn,
      }));
    }),

    toggleGroupMember: publicProcedure
      .input(z.object({ userId: z.number(), isMember: z.boolean() }))
      .mutation(async ({ input, ctx }) => {
        await requireAdmin(ctx);
        await updateCustomUserGroupMembership(input.userId, input.isMember);
        return { success: true };
      }),

    /** Ban/restrict/unban a user */
    updateBanStatus: publicProcedure
      .input(z.object({
        userId: z.number(),
        banStatus: z.enum(["active", "restricted", "temp_banned", "banned"]),
        banReason: z.string().optional(),
        banDurationHours: z.number().optional(), // for temp_banned
      }))
      .mutation(async ({ input, ctx }) => {
        await requireAdmin(ctx);
        const targetUser = await getCustomUserById(input.userId);
        if (!targetUser) throw new TRPCError({ code: "NOT_FOUND" });
        // Cannot ban admin
        if (isAdmin(targetUser)) throw new TRPCError({ code: "FORBIDDEN", message: "Não é possível banir o administrador" });

        let banExpiresAt: Date | null = null;
        if (input.banStatus === "temp_banned" && input.banDurationHours) {
          banExpiresAt = new Date(Date.now() + input.banDurationHours * 60 * 60 * 1000);
        }

        await updateCustomUserBanStatus(input.userId, {
          banStatus: input.banStatus,
          banReason: input.banReason,
          banExpiresAt,
          isActive: input.banStatus === "active" || input.banStatus === "restricted",
        });
        return { success: true };
      }),

    /** Get Mercado Pago status */
    mpStatus: publicProcedure.query(async ({ ctx }) => {
      await requireAdmin(ctx);
      const configured = await isMercadoPagoConfigured();
      // Get saved settings
      const settings = await getSettings(["mp_access_token", "mp_public_key", "contact_telegram"]);
      return {
        configured,
        hasCustomToken: !!(settings.mp_access_token && settings.mp_access_token.length > 10),
        contactTelegram: settings.contact_telegram || "@Danielssh",
      };
    }),

    /** Update site settings (MP keys, contact, etc.) */
    updateSettings: publicProcedure
      .input(z.object({
        mpAccessToken: z.string().optional(),
        mpPublicKey: z.string().optional(),
        contactTelegram: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await requireAdmin(ctx);
        if (input.mpAccessToken !== undefined) await setSetting("mp_access_token", input.mpAccessToken);
        if (input.mpPublicKey !== undefined) await setSetting("mp_public_key", input.mpPublicKey);
        if (input.contactTelegram !== undefined) await setSetting("contact_telegram", input.contactTelegram);
        return { success: true };
      }),

    /** Get site settings */
    getSettings: publicProcedure.query(async ({ ctx }) => {
      await requireAdmin(ctx);
      const settings = await getSettings(["mp_access_token", "mp_public_key", "contact_telegram"]);
      return {
        mpAccessToken: settings.mp_access_token ? "****" + settings.mp_access_token.slice(-8) : "",
        mpPublicKey: settings.mp_public_key || "",
        contactTelegram: settings.contact_telegram || "@Danielssh",
      };
    }),

    /** Get contact info (public) */
    getContactInfo: publicProcedure.query(async () => {
      const contact = await getSetting("contact_telegram");
      return { contactTelegram: contact || "@Danielssh" };
    }),

    /** Grant access to paid content manually (admin only) */
    grantAccess: publicProcedure
      .input(z.object({
        userId: z.number(),
        productId: z.number(),
        maxDownloads: z.number().min(1).max(100).default(5),
      }))
      .mutation(async ({ input, ctx }) => {
        await requireAdmin(ctx);
        const targetUser = await getCustomUserById(input.userId);
        if (!targetUser) throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });
        const product = await getProductById(input.productId);
        if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Produto não encontrado" });
        // Check if already has access
        const existing = await getUserApprovedOrderForProduct(input.userId, input.productId);
        if (existing) throw new TRPCError({ code: "BAD_REQUEST", message: "Usuário já tem acesso a este produto" });
        // Create approved order manually
        const order = await createOrder({
          userId: input.userId,
          productId: input.productId,
          amountCents: 0,
          status: "approved",
          externalReference: `MANUAL-${nanoid(12)}`,
          paymentMethod: "manual",
          maxDownloads: input.maxDownloads,
        });
        return { success: true, orderId: order.id };
      }),

    /** Revoke access to paid content (admin only) */
    revokeAccess: publicProcedure
      .input(z.object({ orderId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await requireAdmin(ctx);
        await updateOrderStatus(input.orderId, "cancelled");
        return { success: true };
      }),

    /** Delete a user completely (admin only) */
    deleteUser: publicProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const admin = await requireAdmin(ctx);
        const targetUser = await getCustomUserById(input.userId);
        if (!targetUser) throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });
        if (isAdmin(targetUser)) throw new TRPCError({ code: "FORBIDDEN", message: "Não é possível apagar o administrador" });
        await deleteCustomUser(input.userId);
        return { success: true };
      }),

    /** Edit user data (admin only) */
    editUser: publicProcedure
      .input(z.object({
        userId: z.number(),
        username: z.string().min(3).max(128).optional(),
        displayName: z.string().max(256).optional(),
        email: z.string().max(320).optional(),
        phone: z.string().max(32).optional(),
        isGroupMember: z.boolean().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await requireAdmin(ctx);
        const { userId, ...data } = input;
        const targetUser = await getCustomUserById(userId);
        if (!targetUser) throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });
        await updateCustomUser(userId, data);
        return { success: true };
      }),

    /** Reset user password (admin only) */
    resetPassword: publicProcedure
      .input(z.object({
        userId: z.number(),
        newPassword: z.string().min(6).max(128),
      }))
      .mutation(async ({ input, ctx }) => {
        await requireAdmin(ctx);
        const targetUser = await getCustomUserById(input.userId);
        if (!targetUser) throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });
        const passwordHash = await hashPassword(input.newPassword);
        await updateCustomUser(input.userId, { passwordHash });
        return { success: true };
      }),

    /** Upload site logo (admin only) */
    uploadLogo: publicProcedure
      .input(z.object({
        logoType: z.enum(["header", "banner", "favicon"]),
        imageData: z.string(), // base64
        mimeType: z.string(),
        fileName: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        await requireAdmin(ctx);
        const buffer = Buffer.from(input.imageData, "base64");
        const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
        const key = `site/logos/${input.logoType}-${nanoid(8)}-${safeName}`;
        const result = await storagePut(key, buffer, input.mimeType);
        await setSetting(`logo_${input.logoType}`, result.url);
        return { url: result.url };
      }),

    /** Get site logos */
    getLogos: publicProcedure.query(async () => {
      const settings = await getSettings(["logo_header", "logo_banner", "logo_favicon"]);
      return {
        header: settings.logo_header || "",
        banner: settings.logo_banner || "",
        favicon: settings.logo_favicon || "",
      };
    }),
  }),
  
  // Forum Routes
  forum: router({
    createThread: protectedProcedure
      .input(z.object({
        categoryId: z.number(),
        title: z.string().min(3).max(512),
        content: z.string().min(10),
        tag: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await requireCustomUser(ctx);
        return createForumThread({
          categoryId: input.categoryId,
          authorId: user.id,
          title: input.title,
          content: input.content,
          tag: input.tag,
        });
      }),
    
    getThreadsByCategory: publicProcedure
      .input(z.object({
        categoryId: z.number(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      }))
      .query(async ({ input }) => {
        return getForumThreadsByCategory(input.categoryId, input.limit, input.offset);
      }),
    
    getThread: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return getForumThreadById(input);
      }),
    
    createComment: protectedProcedure
      .input(z.object({
        threadId: z.number(),
        content: z.string().min(1).max(5000),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await requireCustomUser(ctx);
        return createForumComment({
          threadId: input.threadId,
          authorId: user.id,
          content: input.content,
        });
      }),
    
    getComments: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return getForumCommentsByThread(input);
      }),
    
    toggleLike: protectedProcedure
      .input(z.object({
        targetType: z.enum(["thread", "comment"]),
        targetId: z.number(),
        value: z.enum(["1", "-1"]).transform(v => parseInt(v) as 1 | -1),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await requireCustomUser(ctx);
        await toggleForumLike({
          targetType: input.targetType,
          targetId: input.targetId,
          userId: user.id,
          value: input.value,
        });
        return getForumLikeCount(input.targetType, input.targetId);
      }),
    
    getLikes: publicProcedure
      .input(z.object({
        targetType: z.enum(["thread", "comment"]),
        targetId: z.number(),
      }))
      .query(async ({ input }) => {
        return getForumLikeCount(input.targetType, input.targetId);
      }),
  }),
  
  // Roles & Permissions Routes
  roles: router({
    list: publicProcedure.query(async () => {
      return getAllRoles();
    }),
    
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1).max(128),
        color: z.string().optional(),
        icon: z.string().optional(),
        permissions: z.array(z.string()),
      }))
      .mutation(async ({ input }) => {
        return createRole(input);
      }),
    
    assignToUser: adminProcedure
      .input(z.object({
        userId: z.number(),
        roleId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await assignRoleToUser(input.userId, input.roleId);
      }),
    
    removeFromUser: adminProcedure
      .input(z.object({
        userId: z.number(),
        roleId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await removeRoleFromUser(input.userId, input.roleId);
      }),
    
    getUserRoles: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return getUserRoles(input);
      }),
  }),
  
  // Profile Routes
  profile: router({
    uploadProfilePhoto: protectedProcedure
      .input(z.object({
        photoBase64: z.string(),
        mimeType: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await requireCustomUser(ctx);
        const buffer = Buffer.from(input.photoBase64, 'base64');
        const key = `users/${user.id}/profile-photo-${Date.now()}.jpg`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        await updateUserProfilePhoto(user.id, url);
        return { url };
      }),
  }),
});

export type AppRouter = typeof appRouter;

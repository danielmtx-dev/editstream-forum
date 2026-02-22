import { bigint, boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing Manus OAuth flow (keep for system compatibility).
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Custom users - login with email/phone + password
 * Only @Danielssh (the owner) can be admin - enforced in code
 * Now with Telegram verification and ban system
 */
export const customUsers = mysqlTable("customUsers", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 128 }).notNull().unique(),
  email: varchar("email", { length: 320 }).unique(),
  phone: varchar("phone", { length: 32 }).unique(),
  passwordHash: varchar("passwordHash", { length: 256 }).notNull(),
  displayName: varchar("displayName", { length: 256 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  /** Whether user has joined/verified group membership */
  isGroupMember: boolean("isGroupMember").default(false).notNull(),
  /** Account active status */
  isActive: boolean("isActive").default(true).notNull(),
  /** Ban status: active = normal, restricted = limited access, temp_banned = temporary ban, banned = permanent */
  banStatus: mysqlEnum("banStatus", ["active", "restricted", "temp_banned", "banned"]).default("active").notNull(),
  /** Reason for ban/restriction */
  banReason: text("banReason"),
  /** When temp ban expires */
  banExpiresAt: timestamp("banExpiresAt"),
  /** Telegram user ID (from Telegram Login Widget) */
  telegramId: varchar("telegramId", { length: 64 }).unique(),
  /** Telegram username */
  telegramUsername: varchar("telegramUsername", { length: 128 }),
  /** Telegram first name */
  telegramFirstName: varchar("telegramFirstName", { length: 256 }),
  /** Telegram photo URL */
  telegramPhotoUrl: text("telegramPhotoUrl"),
  /** Whether Telegram is verified */
  telegramVerified: boolean("telegramVerified").default(false).notNull(),
  /** User profile photo URL (S3) */
  profilePhotoUrl: text("profilePhotoUrl"),
  /** Failed login attempts (brute force protection) */
  failedLoginAttempts: int("failedLoginAttempts").default(0).notNull(),
  lockedUntil: timestamp("lockedUntil"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn"),
});

export type CustomUser = typeof customUsers.$inferSelect;
export type InsertCustomUser = typeof customUsers.$inferInsert;

/**
 * Categories for organizing products
 */
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  slug: varchar("slug", { length: 256 }).notNull().unique(),
  icon: varchar("icon", { length: 64 }).default("📦").notNull(),
  description: text("description"),
  /** Section for grouping categories on the home page */
  section: varchar("section", { length: 256 }).default("Geral").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * Products - main content posted by admin only
 * Now supports multiple images and files via separate tables
 */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 512 }).notNull(),
  description: text("description").notNull(),
  /** Price in BRL cents (0 = free) */
  priceCents: int("priceCents").default(0).notNull(),
  isFree: boolean("isFree").default(false).notNull(),
  categoryId: int("categoryId").notNull(),
  /** Main product image URL (S3) - kept for backward compat */
  imageUrl: text("imageUrl"),
  imageKey: varchar("imageKey", { length: 512 }),
  /** Main downloadable file URL (S3) - NEVER exposed directly */
  fileUrl: text("fileUrl"),
  fileKey: varchar("fileKey", { length: 512 }),
  fileName: varchar("fileName", { length: 512 }),
  fileSize: bigint("fileSize", { mode: "number" }),
  /** Payment methods: only "pix" now (boleto removed) */
  paymentMethods: varchar("paymentMethods", { length: 256 }).default("").notNull(),
  pixKey: varchar("pixKey", { length: 512 }),
  paymentInstructions: text("paymentInstructions"),
  /** External download links (JSON array of {label, url}) for files > 150MB */
  externalLinks: text("externalLinks"),
  isActive: boolean("isActive").default(true).notNull(),
  isPinned: boolean("isPinned").default(false).notNull(),
  viewCount: int("viewCount").default(0).notNull(),
  downloadCount: int("downloadCount").default(0).notNull(),
  createdById: int("createdById").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Product images - multiple images per product
 */
export const productImages = mysqlTable("productImages", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  imageUrl: text("imageUrl").notNull(),
  imageKey: varchar("imageKey", { length: 512 }).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProductImage = typeof productImages.$inferSelect;

/**
 * Product files - multiple files per product
 */
export const productFiles = mysqlTable("productFiles", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  fileName: varchar("fileName", { length: 512 }).notNull(),
  fileSize: bigint("fileSize", { mode: "number" }).default(0).notNull(),
  fileMimeType: varchar("fileMimeType", { length: 256 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProductFile = typeof productFiles.$inferSelect;

/**
 * Orders - tracks purchases via Mercado Pago (PIX only now)
 */
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  amountCents: int("amountCents").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "refunded", "cancelled"]).default("pending").notNull(),
  mpPreferenceId: varchar("mpPreferenceId", { length: 256 }),
  mpPaymentId: varchar("mpPaymentId", { length: 256 }),
  externalReference: varchar("externalReference", { length: 128 }).unique(),
  paymentMethod: varchar("paymentMethod", { length: 64 }),
  downloadCount: int("downloadCount").default(0).notNull(),
  maxDownloads: int("maxDownloads").default(5).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Site settings - admin-configurable settings (MP keys, contact info, etc.)
 */
export const siteSettings = mysqlTable("siteSettings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("settingKey", { length: 128 }).notNull().unique(),
  settingValue: text("settingValue"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SiteSetting = typeof siteSettings.$inferSelect;

/**
 * Forum Threads - topics created by users within categories
 */
export const forumThreads = mysqlTable("forumThreads", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("categoryId").notNull(),
  authorId: int("authorId").notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  content: text("content").notNull(),
  /** Tag: resource, selling, showcase, question, tutorial, discussion, announcement */
  tag: varchar("tag", { length: 64 }).default("discussion").notNull(),
  isPinned: boolean("isPinned").default(false).notNull(),
  isLocked: boolean("isLocked").default(false).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  viewCount: int("viewCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ForumThread = typeof forumThreads.$inferSelect;
export type InsertForumThread = typeof forumThreads.$inferInsert;

/**
 * Forum Comments - replies to threads
 */
export const forumComments = mysqlTable("forumComments", {
  id: int("id").autoincrement().primaryKey(),
  threadId: int("threadId").notNull(),
  authorId: int("authorId").notNull(),
  content: text("content").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ForumComment = typeof forumComments.$inferSelect;
export type InsertForumComment = typeof forumComments.$inferInsert;

/**
 * Forum Likes - likes/dislikes on threads and comments
 * value: 1 = like, -1 = dislike
 */
export const forumLikes = mysqlTable("forumLikes", {
  id: int("id").autoincrement().primaryKey(),
  /** 'thread' or 'comment' */
  targetType: varchar("targetType", { length: 16 }).notNull(),
  targetId: int("targetId").notNull(),
  userId: int("userId").notNull(),
  /** 1 = like, -1 = dislike */
  value: int("value").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ForumLike = typeof forumLikes.$inferSelect;

/**
 * Roles - custom roles with permissions (admin-defined)
 */
export const roles = mysqlTable("roles", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull().unique(),
  /** Display color (hex) */
  color: varchar("color", { length: 16 }).default("#6B7280").notNull(),
  /** Icon emoji or name */
  icon: varchar("icon", { length: 64 }).default("⭐").notNull(),
  /** JSON array of permission strings */
  permissions: text("permissions").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Role = typeof roles.$inferSelect;
export type InsertRole = typeof roles.$inferInsert;

/**
 * User Roles - N:N relationship between users and roles
 */
export const userRoles = mysqlTable("userRoles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  roleId: int("roleId").notNull(),
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
});

export type UserRole = typeof userRoles.$inferSelect;


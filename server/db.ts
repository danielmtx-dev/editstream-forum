import { eq, desc, sql, asc, and, or, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  categories, InsertCategory, Category,
  products, InsertProduct, Product,
  customUsers, InsertCustomUser, CustomUser,
  orders, InsertOrder, Order,
  productImages, ProductImage,
  productFiles, ProductFile,
  siteSettings, SiteSetting,
  forumThreads, forumComments, forumLikes,
  roles, userRoles,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================
// Manus OAuth User Queries (system compatibility)
// ============================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============================================
// Custom User Queries
// ============================================

const ADMIN_USERNAME = "Danielssh";

export async function createCustomUser(data: {
  username: string;
  email?: string;
  phone?: string;
  passwordHash: string;
  displayName?: string;
  isGroupMember?: boolean;
}): Promise<CustomUser> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const role = data.username === ADMIN_USERNAME ? "admin" : "user";
  // Sanitize optional fields: empty strings become undefined so Drizzle omits them from INSERT
  const emailVal = data.email && data.email.trim() ? data.email.trim() : undefined;
  const phoneVal = data.phone && data.phone.trim() ? data.phone.trim() : undefined;
  
  const insertData: any = {
    username: data.username,
    passwordHash: data.passwordHash,
    displayName: data.displayName || data.username,
    role,
    isGroupMember: data.isGroupMember ?? false,
    isActive: true,
    banStatus: "active",
    telegramVerified: false,
    failedLoginAttempts: 0,
  };
  // Only include email/phone if they have actual values
  if (emailVal) insertData.email = emailVal;
  if (phoneVal) insertData.phone = phoneVal;
  
  try {
    const result = await db.insert(customUsers).values(insertData);
    const insertId = result[0].insertId;
    const [record] = await db.select().from(customUsers).where(eq(customUsers.id, insertId)).limit(1);
    return record;
  } catch (err: any) {
    const msg = err?.message || "";
    // Handle duplicate key errors with friendly messages
    if (msg.includes("Duplicate") || msg.includes("duplicate") || msg.includes("UNIQUE") || msg.includes("1062")) {
      if (msg.includes("username")) throw new Error("Nome de usu\u00e1rio j\u00e1 est\u00e1 em uso");
      if (msg.includes("email")) throw new Error("Este e-mail j\u00e1 est\u00e1 cadastrado");
      if (msg.includes("phone")) throw new Error("Este telefone j\u00e1 est\u00e1 cadastrado");
      if (msg.includes("telegramId")) throw new Error("Esta conta do Telegram j\u00e1 est\u00e1 vinculada a outro usu\u00e1rio");
      throw new Error("Dados j\u00e1 cadastrados. Tente com informa\u00e7\u00f5es diferentes.");
    }
    // Generic DB error - never expose SQL
    console.error("[createCustomUser] DB error:", msg);
    throw new Error("Erro ao criar conta. Tente novamente.");
  }
}

export async function getCustomUserByLogin(login: string): Promise<CustomUser | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [record] = await db.select().from(customUsers)
    .where(or(
      eq(customUsers.email, login),
      eq(customUsers.phone, login),
      eq(customUsers.username, login)
    ))
    .limit(1);
  return record;
}

export async function getCustomUserById(id: number): Promise<CustomUser | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [record] = await db.select().from(customUsers).where(eq(customUsers.id, id)).limit(1);
  return record;
}

export async function getCustomUserByTelegramId(telegramId: string): Promise<CustomUser | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [record] = await db.select().from(customUsers).where(eq(customUsers.telegramId, telegramId)).limit(1);
  return record;
}

export async function incrementFailedLogin(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [user] = await db.select().from(customUsers).where(eq(customUsers.id, userId)).limit(1);
  if (!user) return;
  const attempts = user.failedLoginAttempts + 1;
  const update: any = { failedLoginAttempts: attempts };
  if (attempts >= 5) {
    update.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
  }
  await db.update(customUsers).set(update).where(eq(customUsers.id, userId));
}

export async function resetFailedLogin(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(customUsers).set({
    failedLoginAttempts: 0,
    lockedUntil: null,
    lastSignedIn: new Date(),
  }).where(eq(customUsers.id, userId));
}

export async function updateCustomUserGroupMembership(userId: number, isMember: boolean): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(customUsers).set({ isGroupMember: isMember }).where(eq(customUsers.id, userId));
}

export async function updateCustomUserTelegram(userId: number, data: {
  telegramId: string;
  telegramUsername?: string;
  telegramFirstName?: string;
  telegramPhotoUrl?: string;
  telegramVerified: boolean;
  isGroupMember?: boolean;
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(customUsers).set({
    telegramId: data.telegramId,
    telegramUsername: data.telegramUsername || null,
    telegramFirstName: data.telegramFirstName || null,
    telegramPhotoUrl: data.telegramPhotoUrl || null,
    telegramVerified: data.telegramVerified,
    ...(data.isGroupMember !== undefined ? { isGroupMember: data.isGroupMember } : {}),
  }).where(eq(customUsers.id, userId));
}

export async function updateCustomUserBanStatus(userId: number, data: {
  banStatus: "active" | "restricted" | "temp_banned" | "banned";
  banReason?: string;
  banExpiresAt?: Date | null;
  isActive?: boolean;
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const update: any = { banStatus: data.banStatus };
  if (data.banReason !== undefined) update.banReason = data.banReason;
  if (data.banExpiresAt !== undefined) update.banExpiresAt = data.banExpiresAt;
  if (data.isActive !== undefined) update.isActive = data.isActive;
  // Banned or temp_banned deactivates account
  if (data.banStatus === "banned") update.isActive = false;
  await db.update(customUsers).set(update).where(eq(customUsers.id, userId));
}

export async function deleteCustomUser(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Delete related orders first
  await db.delete(orders).where(eq(orders.userId, userId));
  // Delete the user
  await db.delete(customUsers).where(eq(customUsers.id, userId));
}

export async function updateCustomUser(userId: number, data: {
  username?: string;
  displayName?: string;
  email?: string | null;
  phone?: string | null;
  passwordHash?: string;
  isGroupMember?: boolean;
  isActive?: boolean;
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const update: any = {};
  if (data.username !== undefined) update.username = data.username;
  if (data.displayName !== undefined) update.displayName = data.displayName;
  if (data.email !== undefined) update.email = data.email || null;
  if (data.phone !== undefined) update.phone = data.phone || null;
  if (data.passwordHash !== undefined) update.passwordHash = data.passwordHash;
  if (data.isGroupMember !== undefined) update.isGroupMember = data.isGroupMember;
  if (data.isActive !== undefined) update.isActive = data.isActive;
  if (Object.keys(update).length > 0) {
    await db.update(customUsers).set(update).where(eq(customUsers.id, userId));
  }
}

export async function getAllCustomUsers(): Promise<CustomUser[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(customUsers).orderBy(desc(customUsers.createdAt));
}

export async function getCustomUserCount(): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.select({ count: sql<number>`count(*)` }).from(customUsers);
  return result?.count || 0;
}

// ============================================
// Category Queries
// ============================================

export async function getAllCategories(activeOnly = false): Promise<Category[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (activeOnly) {
    return db.select().from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.sortOrder));
  }
  return db.select().from(categories).orderBy(asc(categories.sortOrder));
}

export async function getCategoryById(id: number): Promise<Category | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [record] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return record;
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [record] = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return record;
}

export async function insertCategory(cat: InsertCategory): Promise<Category> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(categories).values(cat);
  const insertId = result[0].insertId;
  const [record] = await db.select().from(categories).where(eq(categories.id, insertId)).limit(1);
  return record;
}

export async function updateCategory(id: number, data: Partial<InsertCategory>): Promise<Category | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(categories).set(data).where(eq(categories.id, id));
  const [record] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return record;
}

export async function deleteCategory(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(categories).where(eq(categories.id, id));
}

// ============================================
// Product Queries
// ============================================

export async function getAllProducts(activeOnly = false): Promise<Product[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (activeOnly) {
    return db.select().from(products).where(eq(products.isActive, true)).orderBy(desc(products.isPinned), desc(products.createdAt));
  }
  return db.select().from(products).orderBy(desc(products.isPinned), desc(products.createdAt));
}

export async function getProductsByCategory(categoryId: number, activeOnly = false): Promise<Product[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (activeOnly) {
    return db.select().from(products)
      .where(and(eq(products.categoryId, categoryId), eq(products.isActive, true)))
      .orderBy(desc(products.isPinned), desc(products.createdAt));
  }
  return db.select().from(products).where(eq(products.categoryId, categoryId)).orderBy(desc(products.isPinned), desc(products.createdAt));
}

export async function getProductById(id: number): Promise<Product | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [record] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return record;
}

export async function insertProduct(product: InsertProduct): Promise<Product> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(products).values(product);
  const insertId = result[0].insertId;
  const [record] = await db.select().from(products).where(eq(products.id, insertId)).limit(1);
  return record;
}

export async function updateProduct(id: number, data: Partial<InsertProduct>): Promise<Product | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(products).set(data).where(eq(products.id, id));
  const [record] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return record;
}

export async function deleteProduct(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Also delete associated images and files
  await deleteProductImages(id);
  await deleteProductFiles(id);
  await db.delete(products).where(eq(products.id, id));
}

export async function incrementProductView(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(products).set({ viewCount: sql`${products.viewCount} + 1` }).where(eq(products.id, id));
}

export async function incrementProductDownload(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(products).set({ downloadCount: sql`${products.downloadCount} + 1` }).where(eq(products.id, id));
}

export async function getProductStats(): Promise<{
  totalProducts: number; totalViews: number; totalDownloads: number;
  totalOrders: number; totalRevenue: number; totalUsers: number;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [prodStats] = await db.select({
    totalProducts: sql<number>`count(*)`,
    totalViews: sql<number>`COALESCE(sum(${products.viewCount}), 0)`,
    totalDownloads: sql<number>`COALESCE(sum(${products.downloadCount}), 0)`,
  }).from(products);
  const [orderStats] = await db.select({
    totalOrders: sql<number>`count(*)`,
    totalRevenue: sql<number>`COALESCE(sum(${orders.amountCents}), 0)`,
  }).from(orders).where(eq(orders.status, "approved"));
  const userCount = await getCustomUserCount();
  return {
    totalProducts: prodStats?.totalProducts || 0,
    totalViews: prodStats?.totalViews || 0,
    totalDownloads: prodStats?.totalDownloads || 0,
    totalOrders: orderStats?.totalOrders || 0,
    totalRevenue: orderStats?.totalRevenue || 0,
    totalUsers: userCount,
  };
}

export async function getProductCountByCategory(): Promise<Record<number, number>> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const results = await db.select({
    categoryId: products.categoryId,
    count: sql<number>`count(*)`,
  }).from(products).where(eq(products.isActive, true)).groupBy(products.categoryId);
  const counts: Record<number, number> = {};
  for (const row of results) counts[row.categoryId] = row.count;
  return counts;
}

// ============================================
// Product Images Queries
// ============================================

export async function getProductImages(productId: number): Promise<ProductImage[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(productImages).where(eq(productImages.productId, productId)).orderBy(asc(productImages.sortOrder));
}

export async function addProductImage(data: { productId: number; imageUrl: string; imageKey: string; sortOrder?: number }): Promise<ProductImage> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(productImages).values({
    productId: data.productId,
    imageUrl: data.imageUrl,
    imageKey: data.imageKey,
    sortOrder: data.sortOrder || 0,
  });
  const [record] = await db.select().from(productImages).where(eq(productImages.id, result[0].insertId)).limit(1);
  return record;
}

export async function deleteProductImage(imageId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(productImages).where(eq(productImages.id, imageId));
}

export async function deleteProductImages(productId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(productImages).where(eq(productImages.productId, productId));
}

// ============================================
// Product Files Queries
// ============================================

export async function getProductFiles(productId: number): Promise<ProductFile[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(productFiles).where(eq(productFiles.productId, productId)).orderBy(asc(productFiles.sortOrder));
}

export async function addProductFile(data: {
  productId: number; fileUrl: string; fileKey: string;
  fileName: string; fileSize: number; fileMimeType?: string; sortOrder?: number;
}): Promise<ProductFile> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(productFiles).values({
    productId: data.productId,
    fileUrl: data.fileUrl,
    fileKey: data.fileKey,
    fileName: data.fileName,
    fileSize: data.fileSize,
    fileMimeType: data.fileMimeType || null,
    sortOrder: data.sortOrder || 0,
  });
  const [record] = await db.select().from(productFiles).where(eq(productFiles.id, result[0].insertId)).limit(1);
  return record;
}

export async function deleteProductFile(fileId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(productFiles).where(eq(productFiles.id, fileId));
}

export async function deleteProductFiles(productId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(productFiles).where(eq(productFiles.productId, productId));
}

// ============================================
// Order Queries
// ============================================

export async function createOrder(data: InsertOrder): Promise<Order> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(orders).values(data);
  const insertId = result[0].insertId;
  const [record] = await db.select().from(orders).where(eq(orders.id, insertId)).limit(1);
  return record;
}

export async function getOrderById(id: number): Promise<Order | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [record] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return record;
}

export async function getOrderByExternalRef(ref: string): Promise<Order | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [record] = await db.select().from(orders).where(eq(orders.externalReference, ref)).limit(1);
  return record;
}

export async function getOrdersByUser(userId: number): Promise<Order[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
}

export async function getUserApprovedOrderForProduct(userId: number, productId: number): Promise<Order | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [record] = await db.select().from(orders)
    .where(and(eq(orders.userId, userId), eq(orders.productId, productId), eq(orders.status, "approved")))
    .limit(1);
  return record;
}

export async function updateOrderStatus(id: number, status: "pending" | "approved" | "rejected" | "refunded" | "cancelled", mpPaymentId?: string, paymentMethod?: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const update: any = { status };
  if (mpPaymentId) update.mpPaymentId = mpPaymentId;
  if (paymentMethod) update.paymentMethod = paymentMethod;
  await db.update(orders).set(update).where(eq(orders.id, id));
}

export async function incrementOrderDownload(orderId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(orders).set({ downloadCount: sql`${orders.downloadCount} + 1` }).where(eq(orders.id, orderId));
}

export async function getAllOrders(): Promise<Order[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(orders).orderBy(desc(orders.createdAt));
}

// ============================================
// Site Settings Queries
// ============================================

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [record] = await db.select().from(siteSettings).where(eq(siteSettings.settingKey, key)).limit(1);
  return record?.settingValue || null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Upsert
  const existing = await getSetting(key);
  if (existing !== null) {
    await db.update(siteSettings).set({ settingValue: value }).where(eq(siteSettings.settingKey, key));
  } else {
    await db.insert(siteSettings).values({ settingKey: key, settingValue: value });
  }
}

export async function getSettings(keys: string[]): Promise<Record<string, string | null>> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const records = await db.select().from(siteSettings).where(inArray(siteSettings.settingKey, keys));
  const result: Record<string, string | null> = {};
  for (const k of keys) result[k] = null;
  for (const r of records) result[r.settingKey] = r.settingValue;
  return result;
}


// ============================================
// Forum Queries
// ============================================

export async function createForumThread(data: {
  categoryId: number;
  authorId: number;
  title: string;
  content: string;
  tag?: string;
}): Promise<any> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(forumThreads).values({
    categoryId: data.categoryId,
    authorId: data.authorId,
    title: data.title,
    content: data.content,
    tag: data.tag || "discussion",
  });
  const [thread] = await db.select().from(forumThreads).where(eq(forumThreads.id, result[0].insertId)).limit(1);
  return thread;
}

export async function getForumThreadsByCategory(categoryId: number, limit = 20, offset = 0): Promise<any[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(forumThreads)
    .where(and(eq(forumThreads.categoryId, categoryId), eq(forumThreads.isActive, true)))
    .orderBy(desc(forumThreads.isPinned), desc(forumThreads.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getForumThreadById(threadId: number): Promise<any> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [thread] = await db.select().from(forumThreads).where(eq(forumThreads.id, threadId)).limit(1);
  return thread;
}

export async function createForumComment(data: {
  threadId: number;
  authorId: number;
  content: string;
}): Promise<any> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(forumComments).values(data);
  const [comment] = await db.select().from(forumComments).where(eq(forumComments.id, result[0].insertId)).limit(1);
  return comment;
}

export async function getForumCommentsByThread(threadId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(forumComments)
    .where(and(eq(forumComments.threadId, threadId), eq(forumComments.isActive, true)))
    .orderBy(asc(forumComments.createdAt));
}

export async function toggleForumLike(data: {
  targetType: "thread" | "comment";
  targetId: number;
  userId: number;
  value: 1 | -1;
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await db.select().from(forumLikes)
    .where(and(
      eq(forumLikes.targetType, data.targetType),
      eq(forumLikes.targetId, data.targetId),
      eq(forumLikes.userId, data.userId)
    ))
    .limit(1);

  if (existing.length > 0) {
    if (existing[0].value === data.value) {
      await db.delete(forumLikes).where(eq(forumLikes.id, existing[0].id));
    } else {
      await db.update(forumLikes).set({ value: data.value }).where(eq(forumLikes.id, existing[0].id));
    }
  } else {
    await db.insert(forumLikes).values(data);
  }
}

export async function getForumLikeCount(targetType: "thread" | "comment", targetId: number): Promise<{ likes: number; dislikes: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const likes = await db.select({ count: sql<number>`count(*)` })
    .from(forumLikes)
    .where(and(
      eq(forumLikes.targetType, targetType),
      eq(forumLikes.targetId, targetId),
      eq(forumLikes.value, 1)
    ));
  
  const dislikes = await db.select({ count: sql<number>`count(*)` })
    .from(forumLikes)
    .where(and(
      eq(forumLikes.targetType, targetType),
      eq(forumLikes.targetId, targetId),
      eq(forumLikes.value, -1)
    ));

  return {
    likes: likes[0]?.count || 0,
    dislikes: dislikes[0]?.count || 0,
  };
}

// ============================================
// Roles & Permissions Queries
// ============================================

export async function createRole(data: {
  name: string;
  color?: string;
  icon?: string;
  permissions: string[];
}): Promise<any> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(roles).values({
    name: data.name,
    color: data.color || "#6B7280",
    icon: data.icon || "⭐",
    permissions: JSON.stringify(data.permissions),
  });
  const [role] = await db.select().from(roles).where(eq(roles.id, result[0].insertId)).limit(1);
  return role;
}

export async function getAllRoles(): Promise<any[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(roles).orderBy(asc(roles.sortOrder));
}

export async function assignRoleToUser(userId: number, roleId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await db.select().from(userRoles)
    .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(userRoles).values({ userId, roleId });
  }
}

export async function removeRoleFromUser(userId: number, roleId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(userRoles).where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)));
}

export async function getUserRoles(userId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const userRoleRecords = await db.select().from(userRoles).where(eq(userRoles.userId, userId));
  if (userRoleRecords.length === 0) return [];
  
  const roleIds = userRoleRecords.map(ur => ur.roleId);
  return db.select().from(roles).where(inArray(roles.id, roleIds));
}


export async function updateUserProfilePhoto(userId: number, photoUrl: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(customUsers).set({ profilePhotoUrl: photoUrl }).where(eq(customUsers.id, userId));
}

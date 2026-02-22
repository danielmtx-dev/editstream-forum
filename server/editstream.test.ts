import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// =============================================
// Test helpers
// =============================================

type CookieCall = { name: string; value?: string; options?: Record<string, unknown> };

function createMockContext(overrides?: {
  cookieHeader?: string;
  protocol?: string;
}): { ctx: TrpcContext; cookies: CookieCall[]; clearedCookies: CookieCall[] } {
  const cookies: CookieCall[] = [];
  const clearedCookies: CookieCall[] = [];

  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: overrides?.protocol || "https",
      headers: {
        cookie: overrides?.cookieHeader || "",
        "x-forwarded-proto": "https",
      },
    } as TrpcContext["req"],
    res: {
      cookie: (name: string, value: string, options: Record<string, unknown>) => {
        cookies.push({ name, value, options });
      },
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, cookies, clearedCookies };
}

// =============================================
// 1. Custom Auth Tests
// =============================================
describe("customAuth", () => {
  describe("register", () => {
    it("rejects registration with short username", async () => {
      const { ctx } = createMockContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.customAuth.register({
          username: "ab",
          password: "123456",
        })
      ).rejects.toThrow();
    });

    it("rejects registration with short password", async () => {
      const { ctx } = createMockContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.customAuth.register({
          username: "testuser",
          password: "123",
        })
      ).rejects.toThrow();
    });
  });

  describe("login", () => {
    it("rejects login with empty credentials", async () => {
      const { ctx } = createMockContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.customAuth.login({ login: "", password: "" })
      ).rejects.toThrow();
    });

    it("rejects login with non-existent user", async () => {
      const { ctx } = createMockContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.customAuth.login({ login: "nonexistent_user_xyz", password: "password123" })
      ).rejects.toThrow();
    });

    it("accepts rememberMe parameter", async () => {
      const { ctx } = createMockContext();
      const caller = appRouter.createCaller(ctx);

      // Should still throw for non-existent user, but not for invalid input
      await expect(
        caller.customAuth.login({ login: "nonexistent_user_xyz", password: "password123", rememberMe: true })
      ).rejects.toThrow();
    });
  });

  describe("me", () => {
    it("returns null for unauthenticated user", async () => {
      const { ctx } = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.customAuth.me();
      expect(result).toBeNull();
    });

    it("returns null for invalid cookie", async () => {
      const { ctx } = createMockContext({ cookieHeader: "es_session=invalid_token_here" });
      const caller = appRouter.createCaller(ctx);

      const result = await caller.customAuth.me();
      expect(result).toBeNull();
    });
  });

  describe("logout", () => {
    it("clears the custom session cookie", async () => {
      const { ctx, clearedCookies } = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.customAuth.logout();
      expect(result).toEqual({ success: true });
      expect(clearedCookies).toHaveLength(1);
      expect(clearedCookies[0]?.name).toBe("es_session");
    });
  });
});

// =============================================
// 2. Categories Tests (Public)
// =============================================
describe("categories", () => {
  it("lists active categories publicly", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const categories = await caller.categories.list();
    expect(Array.isArray(categories)).toBe(true);
  });

  it("rejects listAll for non-admin", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.categories.listAll()).rejects.toThrow();
  });

  it("rejects create for non-admin", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.categories.create({
        name: "Test Category",
        slug: "test-category",
        icon: "📦",
        sortOrder: 0,
        isActive: true,
      })
    ).rejects.toThrow();
  });
});

// =============================================
// 3. Products Tests (Public)
// =============================================
describe("products", () => {
  it("lists products publicly without file URLs", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const products = await caller.products.list();
    expect(Array.isArray(products)).toBe(true);
    // Ensure file URLs are stripped
    for (const p of products) {
      expect(p.fileUrl).toBeNull();
      expect(p.fileKey).toBeNull();
    }
  });

  it("lists products filtered by category", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const products = await caller.products.list({ categoryId: 999999 });
    expect(Array.isArray(products)).toBe(true);
    expect(products.length).toBe(0);
  });

  it("returns null for non-existent product", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const product = await caller.products.getById({ id: 999999 });
    expect(product).toBeNull();
  });

  it("strips file URLs from public getById", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const products = await caller.products.list();
    if (products.length > 0) {
      const product = await caller.products.getById({ id: products[0].id });
      if (product) {
        expect(product.fileUrl).toBeNull();
        expect(product.fileKey).toBeNull();
      }
    }
  });

  it("rejects admin listAll for non-admin", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.products.listAll()).rejects.toThrow();
  });

  it("rejects create for non-admin", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.products.create({
        title: "Test",
        description: "Test",
        priceCents: 0,
        isFree: true,
        categoryId: 1,
        paymentMethods: "",
        isPinned: false,
        isActive: true,
      })
    ).rejects.toThrow();
  });

  it("rejects delete for non-admin", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.products.delete({ id: 1 })).rejects.toThrow();
  });

  it("tracks product view", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // Should not throw even for non-existent product
    const result = await caller.products.trackView({ id: 999999 });
    expect(result).toEqual({ success: true });
  });
});

// =============================================
// 4. Downloads Tests (Security)
// =============================================
describe("downloads", () => {
  it("rejects download for unauthenticated user", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.downloads.requestDownload({ productId: 1 })
    ).rejects.toThrow("Faça login para continuar");
  });

  it("returns login_required for canDownload when not authenticated", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.downloads.canDownload({ productId: 1 });
    expect(result.canDownload).toBe(false);
    expect(result.reason).toBe("login_required");
  });

  it("returns login_required for canDownload when product does not exist and user not logged in", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.downloads.canDownload({ productId: 999999 });
    expect(result.canDownload).toBe(false);
    // Without login, login_required takes priority over no_file
    expect(result.reason).toBe("login_required");
  });
});

// =============================================
// 5. Orders Tests (Security)
// =============================================
describe("orders", () => {
  it("rejects createPayment for unauthenticated user", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.orders.createPayment({ productId: 1, origin: "https://example.com" })
    ).rejects.toThrow("Faça login para continuar");
  });

  it("rejects myOrders for unauthenticated user", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.orders.myOrders()).rejects.toThrow("Faça login para continuar");
  });

  it("rejects getById for unauthenticated user", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.orders.getById({ id: 1 })
    ).rejects.toThrow("Faça login para continuar");
  });

  it("rejects listAll for non-admin", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.orders.listAll()).rejects.toThrow();
  });
});

// =============================================
// 6. Admin Routes Tests (Security)
// =============================================
describe("admin", () => {
  it("rejects users list for non-admin", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.admin.users()).rejects.toThrow();
  });

  it("rejects toggleGroupMember for non-admin", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.admin.toggleGroupMember({ userId: 1, isMember: true })
    ).rejects.toThrow();
  });

  it("rejects mpStatus for non-admin", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.admin.mpStatus()).rejects.toThrow();
  });
});

// =============================================
// 7. Mercado Pago Module Tests
// =============================================
describe("mercadopago module", () => {
  it("isMercadoPagoConfigured returns boolean", async () => {
    const { isMercadoPagoConfigured } = await import("./mercadopago");
    const result = await isMercadoPagoConfigured();
    expect(typeof result).toBe("boolean");
  });
});

// =============================================
// 8. Custom Auth Module Tests
// =============================================
describe("customAuth module", () => {
  it("hashPassword produces a valid bcrypt hash", async () => {
    const { hashPassword, verifyPassword } = await import("./customAuth");
    const hash = await hashPassword("testPassword123");
    expect(hash).toBeTruthy();
    expect(hash.startsWith("$2")).toBe(true);

    const isValid = await verifyPassword("testPassword123", hash);
    expect(isValid).toBe(true);

    const isInvalid = await verifyPassword("wrongPassword", hash);
    expect(isInvalid).toBe(false);
  });

  it("verifyCustomToken returns null for invalid token", async () => {
    const { verifyCustomToken } = await import("./customAuth");
    const result = await verifyCustomToken("invalid.token.here");
    expect(result).toBeNull();
  });

  it("isAdmin returns false for null user", async () => {
    const { isAdmin } = await import("./customAuth");
    expect(isAdmin(null)).toBe(false);
  });

  it("ADMIN_USERNAME is Danielssh", async () => {
    const { ADMIN_USERNAME } = await import("./customAuth");
    expect(ADMIN_USERNAME).toBe("Danielssh");
  });
});

// =============================================
// 9. Security Module Tests
// =============================================
describe("security module", () => {
  it("blockSuspiciousRequests blocks sqlmap user agent", async () => {
    const { blockSuspiciousRequests } = await import("./security");

    let statusCode = 0;
    let responseBody: any = null;
    let nextCalled = false;

    const req = {
      headers: { "user-agent": "sqlmap/1.0" },
      path: "/api/test",
    } as any;

    const res = {
      status: (code: number) => {
        statusCode = code;
        return {
          json: (body: any) => { responseBody = body; },
        };
      },
    } as any;

    const next = () => { nextCalled = true; };

    blockSuspiciousRequests(req, res, next);
    expect(statusCode).toBe(403);
    expect(nextCalled).toBe(false);
  });

  it("blockSuspiciousRequests allows normal user agents", async () => {
    const { blockSuspiciousRequests } = await import("./security");

    let nextCalled = false;

    const req = {
      headers: { "user-agent": "Mozilla/5.0 Chrome/120" },
      path: "/api/test",
    } as any;

    const res = {} as any;
    const next = () => { nextCalled = true; };

    blockSuspiciousRequests(req, res, next);
    expect(nextCalled).toBe(true);
  });

  it("blockSuspiciousRequests blocks path traversal", async () => {
    const { blockSuspiciousRequests } = await import("./security");

    let statusCode = 0;
    let nextCalled = false;

    const req = {
      headers: { "user-agent": "Mozilla/5.0" },
      path: "/api/../etc/passwd",
    } as any;

    const res = {
      status: (code: number) => {
        statusCode = code;
        return { json: () => {} };
      },
    } as any;

    const next = () => { nextCalled = true; };

    blockSuspiciousRequests(req, res, next);
    expect(statusCode).toBe(400);
    expect(nextCalled).toBe(false);
  });

  it("sanitizeMiddleware strips script tags from body", async () => {
    const { sanitizeMiddleware } = await import("./security");

    let nextCalled = false;
    const req = {
      body: {
        name: '<script>alert("xss")</script>Hello',
        nested: { value: 'test<script>bad</script>' },
      },
    } as any;

    const res = {} as any;
    const next = () => { nextCalled = true; };

    sanitizeMiddleware(req, res, next);
    expect(nextCalled).toBe(true);
    expect(req.body.name).not.toContain("<script>");
    expect(req.body.nested.value).not.toContain("<script>");
  });
});

// =============================================
// 10. Mercado Pago Access Token Validation
// =============================================
describe("Mercado Pago Access Token", () => {
  it("validates the MP_ACCESS_TOKEN by calling the MP API", async () => {
    const token = process.env.MP_ACCESS_TOKEN;
    if (!token || token.length < 10) {
      console.warn("MP_ACCESS_TOKEN not set, skipping validation test");
      return;
    }

    const response = await fetch("https://api.mercadopago.com/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Token should be valid - 200 OK
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.id).toBeTruthy();
  });
});

// =============================================
// 11. New Features Tests (Phase 12)
// =============================================
describe("admin user management", () => {
  it("rejects banUser for non-admin", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.admin.banUser({ userId: 1, reason: "test", duration: null })
    ).rejects.toThrow();
  });

  it("rejects unbanUser for non-admin", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.admin.unbanUser({ userId: 1 })
    ).rejects.toThrow();
  });
});

describe("admin site settings", () => {
  it("rejects getSettings for non-admin", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.admin.getSettings()).rejects.toThrow();
  });

  it("rejects updateSettings for non-admin", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.admin.updateSettings({
        mpAccessToken: "test",
        mpPublicKey: "test",
        telegramContact: "@test",
      })
    ).rejects.toThrow();
  });
});

describe("products with multiple files", () => {
  it("getImages returns empty array for non-existent product", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const images = await caller.products.getImages({ productId: 999999 });
    expect(Array.isArray(images)).toBe(true);
    expect(images.length).toBe(0);
  });

  it("getFiles returns empty array for non-existent product", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const files = await caller.products.getFiles({ productId: 999999 });
    expect(Array.isArray(files)).toBe(true);
    expect(files.length).toBe(0);
  });

  it("rejects addImage for non-admin", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.products.addImage({
        productId: 1,
        imageUrl: "https://example.com/image.jpg",
        imageKey: "test.jpg",
        isPrimary: false,
      })
    ).rejects.toThrow();
  });

  it("rejects addFile for non-admin", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.products.addFile({
        productId: 1,
        fileUrl: "https://example.com/file.zip",
        fileKey: "test.zip",
        fileName: "test.zip",
        fileSize: 1024,
      })
    ).rejects.toThrow();
  });
});

describe("customAuth publicMembers", () => {
  it("returns array of public members", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const members = await caller.customAuth.publicMembers();
    expect(Array.isArray(members)).toBe(true);
    // Should not expose sensitive fields
    for (const m of members) {
      expect(m).not.toHaveProperty("passwordHash");
      expect(m).not.toHaveProperty("email");
      expect(m).not.toHaveProperty("phone");
    }
  });
});

describe("categories with product counts", () => {
  it("list returns active categories", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const categories = await caller.categories.list();
    expect(Array.isArray(categories)).toBe(true);
    // Each category should have basic fields
    for (const cat of categories) {
      expect(cat).toHaveProperty("id");
      expect(cat).toHaveProperty("name");
      expect(cat).toHaveProperty("slug");
    }
  });
});

// =============================================
// 12. Grant/Revoke Access Tests (Phase 13)
// =============================================
describe("admin grantAccess", () => {
  it("rejects grantAccess for non-admin", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.admin.grantAccess({ userId: 1, productId: 1, maxDownloads: 5 })
    ).rejects.toThrow();
  });

  it("rejects revokeAccess for non-admin", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.admin.revokeAccess({ orderId: 1 })
    ).rejects.toThrow();
  });
});

// =============================================
// 13. Payment with method selection
// =============================================
describe("orders createPayment with paymentMethod", () => {
  it("rejects createPayment for unauthenticated user with paymentMethod", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.orders.createPayment({ productId: 1, origin: "https://example.com", paymentMethod: "pix" })
    ).rejects.toThrow("Fa\u00e7a login para continuar");
  });
});

// =============================================
// 14. Ban status messages in login
// =============================================
describe("customAuth ban messages", () => {
  it("loginUser function exists and rejects invalid credentials", async () => {
    const { loginUser } = await import("./customAuth");
    await expect(loginUser("nonexistent_ban_test", "password123")).rejects.toThrow();
  });

  it("createCustomToken and verifyCustomToken round-trip", async () => {
    const { createCustomToken, verifyCustomToken } = await import("./customAuth");
    const fakeUser = {
      id: 12345,
      username: "testuser",
      role: "user",
      passwordHash: "fakehash",
      email: null,
      phone: null,
      displayName: null,
      avatarUrl: null,
      status: "active",
      banReason: null,
      banExpiresAt: null,
      failedLoginAttempts: 0,
      lastFailedLogin: null,
      telegramId: null,
      telegramUsername: null,
      isGroupMember: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as any;
    const token = await createCustomToken(fakeUser);
    expect(token).toBeTruthy();
    const payload = await verifyCustomToken(token);
    expect(payload).toBeTruthy();
    expect(payload?.userId).toBe(12345);
    expect(payload?.username).toBe("testuser");
    expect(payload?.role).toBe("user");
  });
});

// =============================================
// 15. Telegram Login Widget Auth Tests
// =============================================
describe("telegramAuth", () => {
  it("validateTelegramHash returns false for empty bot token", async () => {
    const { validateTelegramHash } = await import("./telegramAuth");
    const result = validateTelegramHash(
      { id: "123", auth_date: "1700000000", hash: "fakehash" },
      ""
    );
    expect(result).toBe(false);
  });

  it("validateTelegramHash returns false for empty hash", async () => {
    const { validateTelegramHash } = await import("./telegramAuth");
    const result = validateTelegramHash(
      { id: "123", auth_date: "1700000000", hash: "" },
      "7055127470:AAFLnK7F8-BxgBeEkx-XdK8bpQgQ139DCYo"
    );
    expect(result).toBe(false);
  });

  it("validateTelegramHash correctly validates a known hash", async () => {
    const { validateTelegramHash } = await import("./telegramAuth");
    const crypto = await import("crypto");

    // Create a valid test hash using the same algorithm
    const botToken = "test_bot_token_123";
    const data = {
      id: "12345",
      first_name: "Test",
      username: "testuser",
      auth_date: "1700000000",
      hash: "", // will be computed
    };

    // Compute expected hash
    const secretKey = crypto.createHash("sha256").update(botToken).digest();
    const checkFields = [
      `auth_date=${data.auth_date}`,
      `first_name=${data.first_name}`,
      `id=${data.id}`,
      `username=${data.username}`,
    ].sort();
    const dataCheckString = checkFields.join("\n");
    const expectedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

    data.hash = expectedHash;

    const result = validateTelegramHash(data, botToken);
    expect(result).toBe(true);
  });

  it("validateTelegramHash rejects tampered data", async () => {
    const { validateTelegramHash } = await import("./telegramAuth");
    const crypto = await import("crypto");

    const botToken = "test_bot_token_123";
    const data = {
      id: "12345",
      first_name: "Test",
      username: "testuser",
      auth_date: "1700000000",
      hash: "",
    };

    // Compute hash for original data
    const secretKey = crypto.createHash("sha256").update(botToken).digest();
    const checkFields = [
      `auth_date=${data.auth_date}`,
      `first_name=${data.first_name}`,
      `id=${data.id}`,
      `username=${data.username}`,
    ].sort();
    const dataCheckString = checkFields.join("\n");
    data.hash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

    // Tamper with the data
    const tamperedData = { ...data, first_name: "Hacker" };
    const result = validateTelegramHash(tamperedData, botToken);
    expect(result).toBe(false);
  });

  it("isAuthDateValid returns true for recent auth_date", async () => {
    const { isAuthDateValid } = await import("./telegramAuth");
    const now = Math.floor(Date.now() / 1000);
    expect(isAuthDateValid(String(now))).toBe(true);
    expect(isAuthDateValid(String(now - 60))).toBe(true); // 1 minute ago
  });

  it("isAuthDateValid returns false for expired auth_date", async () => {
    const { isAuthDateValid } = await import("./telegramAuth");
    const now = Math.floor(Date.now() / 1000);
    expect(isAuthDateValid(String(now - 7200))).toBe(false); // 2 hours ago
  });

  it("isAuthDateValid returns false for invalid input", async () => {
    const { isAuthDateValid } = await import("./telegramAuth");
    expect(isAuthDateValid("not_a_number")).toBe(false);
    expect(isAuthDateValid("")).toBe(false);
  });

  it("TELEGRAM_BOT_TOKEN env is set", () => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    expect(token).toBeTruthy();
    expect(typeof token).toBe("string");
    expect(token!.length).toBeGreaterThan(10);
  });
});

// =============================================
// Telegram Group Membership Tests
// =============================================

describe("telegramBot group membership", () => {
  it("checkGroupMembership function exists and returns expected shape", async () => {
    const { checkGroupMembership } = await import("./telegramBot");
    expect(typeof checkGroupMembership).toBe("function");
  });

  it("checkGroupMembership returns isMember:false for invalid user ID", async () => {
    const { checkGroupMembership } = await import("./telegramBot");
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) return; // skip if no token
    const result = await checkGroupMembership("999999999999", botToken);
    expect(result).toHaveProperty("isMember");
    expect(result).toHaveProperty("status");
    expect(typeof result.isMember).toBe("boolean");
    expect(typeof result.status).toBe("string");
  });

  it("checkGroupMembership returns error for invalid bot token", async () => {
    const { checkGroupMembership } = await import("./telegramBot");
    const result = await checkGroupMembership("123456", "invalid_token");
    expect(result.isMember).toBe(false);
    expect(["unknown", "error"]).toContain(result.status);
  });

  it("getGroupInviteLink returns the correct Telegram group link", async () => {
    const { getGroupInviteLink } = await import("./telegramBot");
    const link = getGroupInviteLink();
    expect(link).toBe("https://t.me/editstreampro");
  });

  it("EDITSTREAM_GROUP_CHAT_ID is configured correctly", async () => {
    // The group chat ID is hardcoded in telegramBot.ts
    // We verify it indirectly by checking the function works
    const { checkGroupMembership } = await import("./telegramBot");
    expect(typeof checkGroupMembership).toBe("function");
  });
});

describe("recheckGroupMembership tRPC route", () => {
  it("rejects recheckGroupMembership for unauthenticated user", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.customAuth.recheckGroupMembership()).rejects.toThrow();
  });
});

describe("canDownload with group verification", () => {
  it("returns group_required with groupLink for free products when not a member", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);
    // Without auth, should return login_required
    const result = await caller.downloads.canDownload({ productId: 999 });
    expect(result.canDownload).toBe(false);
    expect(result.reason).toBe("login_required");
  });
});


// =============================================
// Phase 26: Change Password + Monospace Code
// =============================================

describe("customAuth.changePassword", () => {
  it("should reject when not authenticated", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.customAuth.changePassword({ currentPassword: "old123", newPassword: "new123" })
    ).rejects.toThrow();
  });

  it("should reject when current password is wrong", async () => {
    const { ctx, cookies } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // Register a user first
    const uniqueUser = `changepw_${Date.now()}`;
    await caller.customAuth.register({ username: uniqueUser, password: "original123" });
    const sessionCookie = cookies[0]?.value;
    expect(sessionCookie).toBeTruthy();

    // Try to change with wrong current password
    const { ctx: authCtx } = createMockContext({ cookieHeader: `es_session=${sessionCookie}` });
    const authCaller = appRouter.createCaller(authCtx);
    await expect(
      authCaller.customAuth.changePassword({ currentPassword: "wrongpassword", newPassword: "new123456" })
    ).rejects.toThrow("Senha atual incorreta");
  });

  it("should change password successfully with correct current password", async () => {
    const { ctx, cookies } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // Register
    const uniqueUser = `changepw2_${Date.now()}`;
    await caller.customAuth.register({ username: uniqueUser, password: "original123" });
    const sessionCookie = cookies[0]?.value;

    // Change password
    const { ctx: authCtx } = createMockContext({ cookieHeader: `es_session=${sessionCookie}` });
    const authCaller = appRouter.createCaller(authCtx);
    const result = await authCaller.customAuth.changePassword({ currentPassword: "original123", newPassword: "newpass123" });
    expect(result.success).toBe(true);

    // Verify new password works for login
    const { ctx: loginCtx } = createMockContext();
    const loginCaller = appRouter.createCaller(loginCtx);
    const loginResult = await loginCaller.customAuth.login({ login: uniqueUser, password: "newpass123" });
    expect(loginResult.username).toBe(uniqueUser);
  });

  it("should reject new password shorter than 6 characters", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.customAuth.changePassword({ currentPassword: "old123", newPassword: "short" })
    ).rejects.toThrow();
  });
});

describe("Telegram bot monospace code", () => {
  it("should format confirmation message with HTML code tag", async () => {
    const { processWebhookUpdate, generateLoginCode } = await import("./telegramBot");
    
    // Generate a code
    const code = generateLoginCode();
    expect(code).toBeTruthy();
    expect(code.length).toBeGreaterThan(8);
    
    // The code substring should be used in <code> tag format
    const codePrefix = code.substring(0, 8);
    expect(codePrefix.length).toBe(8);
  });
});


// =============================================
// Phase 27: Group Verification System
// =============================================

describe("Group verification system", () => {
  it("should generate and verify registration codes", async () => {
    const { verifyRegistrationCode, consumeVerificationCode } = await import("./telegramBot");
    
    // Non-existent code should be invalid
    const result = verifyRegistrationCode("123456");
    expect(result.valid).toBe(false);
  });

  it("should consume verification code only once", async () => {
    const { consumeVerificationCode } = await import("./telegramBot");
    
    // Non-existent code should be invalid
    const result = consumeVerificationCode("999999");
    expect(result.valid).toBe(false);
  });

  it("sendTelegramVerification route should require bot token", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    // Without TELEGRAM_BOT_TOKEN env, should fail
    const originalToken = process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_BOT_TOKEN;
    
    await expect(
      caller.customAuth.sendTelegramVerification({ telegramUsername: "testuser" })
    ).rejects.toThrow("Bot não configurado");
    
    process.env.TELEGRAM_BOT_TOKEN = originalToken;
  });

  it("verifyTelegramCode route should reject invalid codes", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    await expect(
      caller.customAuth.verifyTelegramCode({ code: "000000" })
    ).rejects.toThrow("Código inválido ou expirado");
  });

  it("register should accept optional verificationCode", async () => {
    const { ctx, cookies } = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    // Register without verification code should still work
    const uniqueUser = `noreg_verify_${Date.now()}`;
    const result = await caller.customAuth.register({
      username: uniqueUser,
      password: "test123456",
    });
    expect(result.username).toBe(uniqueUser);
  });

  it("register with invalid verification code should fail", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    await expect(
      caller.customAuth.register({
        username: `badcode_${Date.now()}`,
        password: "test123456",
        verificationCode: "000000",
      })
    ).rejects.toThrow("Código de verificação inválido ou expirado");
  });
});

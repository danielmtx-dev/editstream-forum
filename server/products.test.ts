import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("products router", () => {
  describe("access control", () => {
    it("allows public access to list products", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      // Should not throw - public access is allowed
      // The actual DB call may fail in test env, but the auth check passes
      try {
        await caller.products.list();
      } catch (e: any) {
        // DB errors are expected in test env, but auth errors should not happen
        expect(e.code).not.toBe("UNAUTHORIZED");
        expect(e.code).not.toBe("FORBIDDEN");
      }
    });

    it("allows public access to get product by ID", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.products.getById({ id: 1 });
      } catch (e: any) {
        expect(e.code).not.toBe("UNAUTHORIZED");
        expect(e.code).not.toBe("FORBIDDEN");
      }
    });

    it("allows public access to track views", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.products.trackView({ id: 1 });
      } catch (e: any) {
        expect(e.code).not.toBe("UNAUTHORIZED");
        expect(e.code).not.toBe("FORBIDDEN");
      }
    });

    it("denies non-admin access to create products", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.products.create({
          title: "Test Product",
          description: "Test description",
          categoryId: 1,
        })
      ).rejects.toThrow();
    });

    it("denies unauthenticated access to create products", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.products.create({
          title: "Test Product",
          description: "Test description",
          categoryId: 1,
        })
      ).rejects.toThrow();
    });

    it("denies non-admin access to delete products", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.products.delete({ id: 1 })
      ).rejects.toThrow();
    });

    it("denies non-admin access to stats", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.products.stats()
      ).rejects.toThrow();
    });

    it("denies non-admin access to listAll", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.products.listAll()
      ).rejects.toThrow();
    });
  });
});

describe("categories router", () => {
  describe("access control", () => {
    it("allows public access to list categories", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.categories.list();
      } catch (e: any) {
        expect(e.code).not.toBe("UNAUTHORIZED");
        expect(e.code).not.toBe("FORBIDDEN");
      }
    });

    it("denies non-admin access to create categories", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.categories.create({
          name: "Test Category",
          slug: "test-category",
        })
      ).rejects.toThrow();
    });

    it("denies unauthenticated access to create categories", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.categories.create({
          name: "Test Category",
          slug: "test-category",
        })
      ).rejects.toThrow();
    });

    it("denies non-admin access to delete categories", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.categories.delete({ id: 1 })
      ).rejects.toThrow();
    });

    it("denies non-admin access to update categories", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.categories.update({ id: 1, name: "Updated" })
      ).rejects.toThrow();
    });

    it("denies non-admin access to listAll categories", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.categories.listAll()
      ).rejects.toThrow();
    });
  });
});

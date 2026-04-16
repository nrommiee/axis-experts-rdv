import { describe, expect, it } from "vitest";
import {
  filterVisibleUsers,
  getUserStatus,
  isUserActive,
  isUserBlocked,
  isUserDeleted,
} from "./admin-users";

const now = "2026-04-16T12:00:00.000Z";

describe("admin-users helpers", () => {
  describe("isUserActive", () => {
    it("returns true when no block / delete", () => {
      expect(isUserActive({ blocked_at: null, deleted_at: null })).toBe(true);
    });

    it("returns false when blocked", () => {
      expect(isUserActive({ blocked_at: now, deleted_at: null })).toBe(false);
    });

    it("returns false when soft-deleted", () => {
      expect(isUserActive({ blocked_at: null, deleted_at: now })).toBe(false);
    });

    it("returns false when both blocked and soft-deleted", () => {
      expect(isUserActive({ blocked_at: now, deleted_at: now })).toBe(false);
    });
  });

  describe("isUserBlocked", () => {
    it("returns true only when blocked and NOT deleted", () => {
      expect(isUserBlocked({ blocked_at: now, deleted_at: null })).toBe(true);
    });

    it("returns false when also soft-deleted (deleted wins)", () => {
      expect(isUserBlocked({ blocked_at: now, deleted_at: now })).toBe(false);
    });

    it("returns false when active", () => {
      expect(isUserBlocked({ blocked_at: null, deleted_at: null })).toBe(false);
    });
  });

  describe("isUserDeleted", () => {
    it("returns true when deleted_at is set", () => {
      expect(isUserDeleted({ blocked_at: null, deleted_at: now })).toBe(true);
    });

    it("returns false when deleted_at null", () => {
      expect(isUserDeleted({ blocked_at: now, deleted_at: null })).toBe(false);
    });
  });

  describe("getUserStatus", () => {
    it("returns active when no block / delete", () => {
      expect(getUserStatus({ blocked_at: null, deleted_at: null })).toBe(
        "active"
      );
    });

    it("returns blocked when only blocked_at is set", () => {
      expect(getUserStatus({ blocked_at: now, deleted_at: null })).toBe(
        "blocked"
      );
    });

    it("returns deleted when deleted_at is set (even if also blocked)", () => {
      expect(getUserStatus({ blocked_at: now, deleted_at: now })).toBe(
        "deleted"
      );
    });
  });

  describe("filterVisibleUsers", () => {
    it("keeps active + blocked and drops deleted", () => {
      const users = [
        { id: "active", blocked_at: null, deleted_at: null },
        { id: "blocked", blocked_at: now, deleted_at: null },
        { id: "deleted", blocked_at: null, deleted_at: now },
        { id: "blocked-then-deleted", blocked_at: now, deleted_at: now },
      ];

      const visible = filterVisibleUsers(users);
      expect(visible.map((u) => u.id)).toEqual(["active", "blocked"]);
    });

    it("returns empty array on empty input", () => {
      expect(filterVisibleUsers([])).toEqual([]);
    });
  });
});

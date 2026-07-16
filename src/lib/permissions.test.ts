import { describe, it, expect } from "vitest";
import {
  getAccessRole,
  canEdit,
  canView,
  canManageSharing,
  canDelete,
} from "@/lib/permissions";

const ownerId = "user_owner";

describe("getAccessRole", () => {
  it("returns OWNER for the document owner", () => {
    expect(getAccessRole({ ownerId, shares: [], userId: ownerId })).toBe("OWNER");
  });

  it("returns null for an anonymous user", () => {
    expect(getAccessRole({ ownerId, shares: [], userId: null })).toBeNull();
  });

  it("returns null for a user with no share", () => {
    expect(
      getAccessRole({
        ownerId,
        shares: [{ userId: "someone", role: "EDITOR" }],
        userId: "stranger",
      })
    ).toBeNull();
  });

  it("returns EDITOR for an editor share", () => {
    expect(
      getAccessRole({ ownerId, shares: [{ userId: "e", role: "EDITOR" }], userId: "e" })
    ).toBe("EDITOR");
  });

  it("returns VIEWER for a viewer share", () => {
    expect(
      getAccessRole({ ownerId, shares: [{ userId: "v", role: "VIEWER" }], userId: "v" })
    ).toBe("VIEWER");
  });

  it("treats unknown role strings as EDITOR-equivalent, not VIEWER", () => {
    expect(
      getAccessRole({ ownerId, shares: [{ userId: "x", role: "WEIRD" }], userId: "x" })
    ).toBe("EDITOR");
  });

  it("prioritizes ownership over an explicit share row", () => {
    expect(
      getAccessRole({
        ownerId,
        shares: [{ userId: ownerId, role: "VIEWER" }],
        userId: ownerId,
      })
    ).toBe("OWNER");
  });
});

describe("capability helpers", () => {
  it("canView allows any granted role, denies null", () => {
    expect(canView("VIEWER")).toBe(true);
    expect(canView("OWNER")).toBe(true);
    expect(canView(null)).toBe(false);
  });

  it("canEdit allows OWNER and EDITOR only", () => {
    expect(canEdit("OWNER")).toBe(true);
    expect(canEdit("EDITOR")).toBe(true);
    expect(canEdit("VIEWER")).toBe(false);
    expect(canEdit(null)).toBe(false);
  });

  it("canManageSharing and canDelete are owner-only", () => {
    expect(canManageSharing("OWNER")).toBe(true);
    expect(canManageSharing("EDITOR")).toBe(false);
    expect(canDelete("OWNER")).toBe(true);
    expect(canDelete("VIEWER")).toBe(false);
  });
});

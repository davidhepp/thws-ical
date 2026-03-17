import { describe, it, expect } from "vitest";
import { safeLuxonZone } from "@/lib/datetime/safeLuxonZone";

describe("safeLuxonZone", () => {
  it("should keep valid TZID", () => {
    expect(safeLuxonZone("America/New_York")).toBe("America/New_York");
    expect(safeLuxonZone("UTC")).toBe("UTC");
  });

  it("should fallback when TZID is missing or invalid", () => {
    expect(safeLuxonZone(undefined)).toBe("Europe/Berlin");
    expect(safeLuxonZone("")).toBe("Europe/Berlin");
    expect(safeLuxonZone("Invalid/Timezone")).toBe("Europe/Berlin");
  });

  it("should allow a custom fallback", () => {
    expect(safeLuxonZone("Invalid/Timezone", "UTC")).toBe("UTC");
  });
});

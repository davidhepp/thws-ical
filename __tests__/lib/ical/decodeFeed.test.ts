import { describe, it, expect } from "vitest";
import { decodeFeed } from "@/lib/ical/decodeFeed";

describe("decodeFeed", () => {
  it("should decode valid UTF-8", () => {
    const text = "BEGIN:VCALENDAR\nSUMMARY:Test Event \u{1F600}\nEND:VCALENDAR";
    const buffer = new TextEncoder().encode(text).buffer;
    const decoded = decodeFeed(buffer);
    expect(decoded).toBe(text);
  });

  it("should fallback to ISO-8859-1 when UTF-8 decoding fails", () => {
    // Create an invalid UTF-8 sequence but valid ISO-8859-1
    // ISO-8859-1: 0xE4 is 'ä'
    const buffer = new Uint8Array([
      0x42, 0x45, 0x47, 0x49, 0x4e, 0x3a, 0xe4, 0x62, 0x63,
    ]).buffer;

    // In ISO-8859-1, 0xE4 is 'ä'
    const decoded = decodeFeed(buffer);
    expect(decoded).toContain("ä");
    expect(decoded).toBe("BEGIN:äbc");
  });
});

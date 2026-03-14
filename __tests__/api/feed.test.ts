import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/feed/[id]/route";
import ICAL from "ical.js";

// Mocks
const mockSelect = vi.fn();
vi.mock("@/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: mockSelect,
      }),
    }),
  },
}));

vi.mock("@/db/schema", () => ({
  feeds: {
    id: "feeds.id",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
}));

const mockRedisGet = vi.fn();
const mockRedisSet = vi.fn();
vi.mock("@upstash/redis", () => ({
  Redis: {
    fromEnv: () => ({
      get: mockRedisGet,
      set: mockRedisSet,
    }),
  },
}));

const createFeedBuffer = (text: string) => {
  return new TextEncoder().encode(text).buffer;
};

describe("GET /api/feed/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 404 if feed is not found", async () => {
    mockSelect.mockResolvedValueOnce([]); // No feeds found
    const req = new Request("http://localhost:3000/api/feed/123");
    const params = Promise.resolve({ id: "123" });

    const res = await GET(req, { params });
    expect(res.status).toBe(404);
  });

  it("should return 500 on db error", async () => {
    mockSelect.mockRejectedValueOnce(new Error("DB connection failed"));
    const req = new Request("http://localhost:3000/api/feed/123");
    const params = Promise.resolve({ id: "123" });

    const res = await GET(req, { params });
    expect(res.status).toBe(500);
  });

  it("should handle valid cached calendar from redis", async () => {
    mockSelect.mockResolvedValueOnce([
      {
        originalUrl: "http://example.com/test.ics",
        selectedCourses: [],
        additionalUrls: null,
      },
    ]);
    mockRedisGet.mockResolvedValueOnce("BEGIN:VCALENDAR...CACHED");

    const req = new Request("http://localhost:3000/api/feed/123");
    const params = Promise.resolve({ id: "123" });

    const res = await GET(req, { params });
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toBe("BEGIN:VCALENDAR...CACHED");
    expect(res.headers.get("Content-Type")).toBe(
      "text/calendar; charset=utf-8",
    );
  });

  it("should return 500 if upstream fetch fails", async () => {
    mockSelect.mockResolvedValueOnce([
      {
        originalUrl: "http://example.com/test.ics",
        selectedCourses: [],
        additionalUrls: null,
      },
    ]);
    mockRedisGet.mockResolvedValueOnce(null);

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
    });

    const req = new Request("http://localhost:3000/api/feed/123");
    const params = Promise.resolve({ id: "123" });

    const res = await GET(req, { params });
    expect(res.status).toBe(500);
  });

  it("should successfully generate a feed for multiple feeds, checking filter, headers, and filename", async () => {
    mockSelect.mockResolvedValueOnce([
      {
        originalUrl: "http://example.com/BaInf6_2026ss.ics",
        selectedCourses: ["Maths"],
        additionalUrls: ["http://example.com/other.ics"],
      },
    ]);
    mockRedisGet.mockResolvedValueOnce(null);

    const ical1 = `BEGIN:VCALENDAR
BEGIN:VTIMEZONE
TZID:America/New_York
END:VTIMEZONE
BEGIN:VEVENT
SUMMARY:Maths
DTSTART;TZID=America/New_York:20260101T100000
DTEND;TZID=America/New_York:20260101T120000
END:VEVENT
BEGIN:VEVENT
SUMMARY:Drop me
DTSTART;TZID=America/New_York:20260101T100000
DTEND;TZID=America/New_York:20260101T120000
END:VEVENT
END:VCALENDAR`;

    const ical2 = `BEGIN:VCALENDAR
BEGIN:VEVENT
SUMMARY:Maths
DTSTART:20260102T100000Z
DTEND:20260102T120000Z
END:VEVENT
END:VCALENDAR`;

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(createFeedBuffer(ical1)),
      })
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(createFeedBuffer(ical2)),
      });

    const req = new Request("http://localhost:3000/api/feed/123");
    const params = Promise.resolve({ id: "123" });

    const res = await GET(req, { params });
    expect(res.status).toBe(200);

    // Headers verification
    expect(res.headers.get("Content-Type")).toBe(
      "text/calendar; charset=utf-8",
    );
    expect(res.headers.get("Content-Disposition")).toBe(
      'inline; filename="BaInf6_2026ss_filtered.ics"',
    );

    const text = await res.text();

    // Check content filters (Drop me shouldn't be here)
    expect(text).toContain("SUMMARY:Maths");
    expect(text).not.toContain("SUMMARY:Drop me");

    // Check timezone preserving
    expect(text).toContain("TZID:America/New_York"); // VTIMEZONE preserved
    expect(text).toContain("TZID=America/New_York"); // VEVENT DTSTART kept exact DTZID

    // Second event had Z (UTC) initially but timezone conversion happens gracefully
    expect(text).toContain("X-WR-TIMEZONE:Europe/Berlin");
    expect(text).toContain("DTSTART:20260102T110000"); // 10am UTC = 11am Berlin (CET)
  });

  it("should return valid empty calendar if no matches found", async () => {
    mockSelect.mockResolvedValueOnce([
      {
        originalUrl: "http://example.com/test.ics",
        selectedCourses: ["Nonexistent"],
        additionalUrls: null,
      },
    ]);
    mockRedisGet.mockResolvedValueOnce(null);

    const ical = `BEGIN:VCALENDAR\nBEGIN:VEVENT\nSUMMARY:Maths\nEND:VEVENT\nEND:VCALENDAR`;
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(createFeedBuffer(ical)),
    });

    const req = new Request("http://localhost:3000/api/feed/123");
    const params = Promise.resolve({ id: "123" });

    const res = await GET(req, { params });
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).not.toContain("VEVENT"); // No events
    expect(text).toContain("BEGIN:VCALENDAR"); // Valid calendar
    expect(text).toContain("END:VCALENDAR");
  });
});

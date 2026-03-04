import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/parse-feed/route";

// Mock ICAL
vi.mock("ical.js", () => {
  return {
    default: {
      parse: vi.fn(),
      Component: class {
        getAllSubcomponents() {
          return [
            { summary: "Course A" },
            { summary: "Course B" },
            { summary: "Course A" }, // Duplicate to test Set logic
          ];
        }
      },
      Event: class {
        summary: string;
        constructor(vevent: any) {
          this.summary = vevent.summary;
        }
      },
    },
  };
});

describe("POST /api/parse-feed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error if urls are missing or invalid", async () => {
    const req = new Request("http://localhost:3000/api/parse-feed", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("URLs are required");
  });

  it("should parse feeds and return unique courses sorted", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    });

    const req = new Request("http://localhost:3000/api/parse-feed", {
      method: "POST",
      body: JSON.stringify({ urls: ["http://example.com/feed.ics"] }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.courses).toEqual(["Course A", "Course B"]);
    expect(global.fetch).toHaveBeenCalledWith("http://example.com/feed.ics");
  });

  it("should return 500 if fetch fails", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      statusText: "Not Found",
    });

    const req = new Request("http://localhost:3000/api/parse-feed", {
      method: "POST",
      body: JSON.stringify({ urls: ["http://example.com/broken.ics"] }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("Failed to parse iCal feed. Please check the URL.");
  });
});

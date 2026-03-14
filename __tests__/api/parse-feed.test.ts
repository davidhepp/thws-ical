import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/parse-feed/route";

const createFeedBuffer = (text: string, encoding = "utf-8") => {
  if (encoding === "utf-8") {
    return new TextEncoder().encode(text).buffer;
  } else {
    const arr = new Uint8Array(text.length);
    for (let i = 0; i < text.length; i++) {
      arr[i] = text.charCodeAt(i);
    }
    return arr.buffer;
  }
};

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

  it("should merge multiple URLs correctly into unique sorted courses", async () => {
    const ical1 = `BEGIN:VCALENDAR\nBEGIN:VEVENT\nSUMMARY:Course A\nEND:VEVENT\nEND:VCALENDAR`;
    const ical2 = `BEGIN:VCALENDAR\nBEGIN:VEVENT\nSUMMARY:Course B\nEND:VEVENT\nBEGIN:VEVENT\nSUMMARY:Course A\nEND:VEVENT\nEND:VCALENDAR`;

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

    const req = new Request("http://localhost:3000/api/parse-feed", {
      method: "POST",
      body: JSON.stringify({ urls: ["http://feed1.ics", "http://feed2.ics"] }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.courses).toEqual(["Course A", "Course B"]);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("should handle empty summaries gracefully", async () => {
    const ical = `BEGIN:VCALENDAR\nBEGIN:VEVENT\nEND:VEVENT\nBEGIN:VEVENT\nSUMMARY:\nEND:VEVENT\nEND:VCALENDAR`;
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(createFeedBuffer(ical)),
    });

    const req = new Request("http://localhost:3000/api/parse-feed", {
      method: "POST",
      body: JSON.stringify({ urls: ["http://empty.ics"] }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.courses).toEqual([]);
  });

  it("should fail entire request if one URL fails (partial failure behavior)", async () => {
    const ical1 = `BEGIN:VCALENDAR\nBEGIN:VEVENT\nSUMMARY:Course A\nEND:VEVENT\nEND:VCALENDAR`;

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(createFeedBuffer(ical1)),
      })
      .mockResolvedValueOnce({
        ok: false,
        statusText: "Not Found",
      });

    const req = new Request("http://localhost:3000/api/parse-feed", {
      method: "POST",
      body: JSON.stringify({ urls: ["http://good.ics", "http://bad.ics"] }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("Failed to parse iCal feed. Please check the URL.");
  });

  it("should throw on invalid ICS content (and return 500)", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(createFeedBuffer("NOT AN ICAL")),
    });

    const req = new Request("http://localhost:3000/api/parse-feed", {
      method: "POST",
      body: JSON.stringify({ urls: ["http://invalid.ics"] }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("Failed to parse iCal feed. Please check the URL.");
  });

  it("should fallback to ISO-8859-1 for invalid UTF-8 payload", async () => {
    // 0xE4 is 'ä' in ISO-8859-1 and invalid UTF-8 block start
    const buffer = new Uint8Array([
      ...new TextEncoder().encode(
        "BEGIN:VCALENDAR\nBEGIN:VEVENT\nSUMMARY:Maths ",
      ),
      0xe4,
      ...new TextEncoder().encode("\nEND:VEVENT\nEND:VCALENDAR"),
    ]).buffer;

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(buffer),
    });

    const req = new Request("http://localhost:3000/api/parse-feed", {
      method: "POST",
      body: JSON.stringify({ urls: ["http://iso.ics"] }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.courses).toEqual(["Maths ä"]);
  });
});

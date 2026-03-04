import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/create-feed/route";

// Mock DB
const mockReturning = vi.fn().mockResolvedValue([{ id: "mock-uuid-123" }]);
const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
const mockInsert = vi.fn().mockReturnValue({ values: mockValues });

vi.mock("@/db", () => ({
  db: {
    insert: (...args: any[]) => mockInsert(...args),
  },
}));

vi.mock("@/db/schema", () => ({
  feeds: {},
}));

describe("POST /api/create-feed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 for invalid inputs", async () => {
    const req = new Request("http://localhost:3000/api/create-feed", {
      method: "POST",
      body: JSON.stringify({ urls: [] }), // Missing selectedCourses, empty urls
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("should insert feed config into db and return id", async () => {
    const urls = ["http://example.com/1.ics", "http://example.com/2.ics"];
    const selectedCourses = ["Math 101"];

    const req = new Request("http://localhost:3000/api/create-feed", {
      method: "POST",
      body: JSON.stringify({ urls, selectedCourses }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.id).toBe("mock-uuid-123");
    expect(mockInsert).toHaveBeenCalled();
    expect(mockValues).toHaveBeenCalledWith({
      originalUrl: "http://example.com/1.ics",
      additionalUrls: ["http://example.com/2.ics"],
      selectedCourses: ["Math 101"],
    });
  });

  it("should return 500 on db error", async () => {
    mockReturning.mockRejectedValueOnce(new Error("DB Error"));

    const req = new Request("http://localhost:3000/api/create-feed", {
      method: "POST",
      body: JSON.stringify({
        urls: ["http://example.com/1.ics"],
        selectedCourses: ["Math 101"],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();

    expect(data.error).toBe("Failed to save feed configuration.");
  });
});

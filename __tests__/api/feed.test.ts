import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/feed/[id]/route";

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
    id: "feeds.id", // Simple mock for EQ comparison
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
}));

describe("GET /api/feed/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 404 if feed is not found", async () => {
    mockSelect.mockResolvedValueOnce([]); // No feeds found

    const req = new Request("http://localhost:3000/api/feed/123");
    const params = Promise.resolve({ id: "123" });

    // We import GET which uses the newer { params: Promise<{ id: string }> } signature
    const res = await GET(req, { params });
    expect(res.status).toBe(404);
    const text = await res.text();
    expect(text).toBe("Feed not found");
  });

  it("should return 500 on db error", async () => {
    mockSelect.mockRejectedValueOnce(new Error("DB connection failed"));

    const req = new Request("http://localhost:3000/api/feed/123");
    const params = Promise.resolve({ id: "123" });

    const res = await GET(req, { params });
    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).toBe("Failed to generate feed");
  });
});

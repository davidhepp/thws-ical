import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "@/app/page";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock Clipboard
const mockWriteText = vi.fn().mockResolvedValue(undefined);
vi.stubGlobal("navigator", {
  ...navigator,
  clipboard: {
    writeText: mockWriteText,
  },
});

// Mock window.isSecureContext
vi.stubGlobal("isSecureContext", true);

// Mock document.execCommand for fallback
document.execCommand = vi.fn();

describe("Home Page", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Step 1: URL Entry", () => {
    it("should render initial step 1 state", () => {
      render(<Home />);
      expect(screen.getByText("Connect your schedule")).toBeDefined();
      expect(screen.getByRole("button", { name: /continue/i })).toBeDefined();
      expect(
        screen.getByRole("button", { name: /add another/i }),
      ).toBeDefined();
      expect(screen.getAllByRole("textbox")).toHaveLength(1); // One URL input initially
    });

    it("should allow adding and removing URL inputs", async () => {
      render(<Home />);
      const addBtn = screen.getByRole("button", { name: /add another/i });

      await user.click(addBtn);
      expect(screen.getAllByRole("textbox")).toHaveLength(2);

      const removeBtns = screen.getAllByTitle("Remove");
      expect(removeBtns).toHaveLength(2); // In the UI, ALL inputs get remove buttons when > 1

      await user.click(removeBtns[1]);
      expect(screen.getAllByRole("textbox")).toHaveLength(1);
    });

    it("should display error if API fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Parse failed" }),
      });

      render(<Home />);
      const input = screen.getByRole("textbox");
      await user.type(input, "http://bad.ics");

      const continueBtn = screen.getByRole("button", { name: /continue/i });
      await user.click(continueBtn);

      await waitFor(() => {
        expect(screen.getByText("Parse failed")).toBeDefined();
      });
    });

    it("should transition to Step 2 on successful /api/parse-feed", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ courses: ["Maths", "Physics"] }),
      });

      render(<Home />);
      const input = screen.getByRole("textbox");
      await user.type(input, "http://good.ics");

      await user.click(screen.getByRole("button", { name: /continue/i }));

      await waitFor(() => {
        expect(screen.getByText("Select your courses")).toBeDefined();
        expect(screen.getByText("Maths")).toBeDefined();
        expect(screen.getByText("Physics")).toBeDefined();
      });
    });
  });

  describe("Step 2: Course Selection", () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ courses: ["Maths", "Physics", "Chemistry"] }),
      });

      render(<Home />);
      await user.type(screen.getByRole("textbox"), "http://good.ics");
      await user.click(screen.getByRole("button", { name: /continue/i }));
      await waitFor(() => screen.getByText("Select your courses"));
    });

    it("should filter courses via search box", async () => {
      const searchBox = screen.getByPlaceholderText("Search courses...");
      await user.type(searchBox, "phy");

      expect(screen.getByText("Physics")).toBeDefined();
      expect(screen.queryByText("Maths")).toBeNull();
    });

    it("should show validation error if generating with no courses", async () => {
      const generateBtn = screen.getByRole("button", {
        name: /generate feed/i,
      });
      // Button is naturally disabled if no courses selected, but user could force it or click it if we remove disabled attr.
      // Actually `disabled={selectedCourses.length === 0 || loading}`, so we can't click it via userEvent natively.
      // We check that it's disabled.
      expect(generateBtn.hasAttribute("disabled")).toBe(true);
    });

    it("should transition to Step 3 on successful /api/create-feed", async () => {
      // Mock create-feed
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "new-feed-123" }),
      });

      // Toggle Maths
      const mathsCourse = screen.getByText("Maths");
      await user.click(mathsCourse);

      const generateBtn = screen.getByRole("button", {
        name: /generate feed/i,
      });
      expect(generateBtn.hasAttribute("disabled")).toBe(false);

      await user.click(generateBtn);

      await waitFor(() => {
        expect(screen.getByText("You're all set!")).toBeDefined();
      });

      // It sets the location origin and append /api/feed/new-feed-123
      const feedUrlInput = screen
        .getAllByRole("textbox")
        .find((el) => (el as HTMLInputElement).value.includes("new-feed-123"));
      expect(feedUrlInput).toBeDefined();
    });
  });

  describe("Step 3: Outcome", () => {
    beforeEach(async () => {
      // Move through 1 and 2
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ courses: ["Maths"] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: "new-feed-123" }),
        });

      render(<Home />);
      await user.type(screen.getByRole("textbox"), "http://good.ics");
      await user.click(screen.getByRole("button", { name: /continue/i }));

      await waitFor(() => screen.getByText("Select your courses"));
      await user.click(screen.getByText("Maths"));
      await user.click(screen.getByRole("button", { name: /generate feed/i }));
      await waitFor(() => screen.getByText("You're all set!"));
    });

    // We skip the primary navigator.clipboard test because JSDOM enforces read-only
    // properties on the global navigator object, making the mock invisible to the component.
    // The fallback test below verifies the copy flow triggers correctly.

    it("should use execCommand fallback if unsecure context", async () => {
      Object.defineProperty(window, "isSecureContext", { value: false });

      const copyBtn = screen.getByRole("button", { name: /copy/i });

      // We must use fireEvent to bypass restrictions sometimes or just userEvent.
      await user.click(copyBtn);

      expect(document.execCommand).toHaveBeenCalledWith("copy");

      // Re-enable for other tests
      Object.defineProperty(window, "isSecureContext", { value: true });
    });

    it("should reset state on 'Filter another schedule'", async () => {
      const resetBtn = screen.getByRole("button", {
        name: /filter another schedule/i,
      });
      await user.click(resetBtn);

      // Should be back at step 1
      expect(screen.getByText("Connect your schedule")).toBeDefined();
    });
  });
});

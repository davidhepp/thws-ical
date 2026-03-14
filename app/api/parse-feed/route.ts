import { NextResponse } from "next/server";
import ICAL from "ical.js";
import { decodeFeed } from "@/lib/ical/decodeFeed";
import { extractCourses } from "@/lib/ical/extractCourses";

export async function POST(request: Request) {
  try {
    const { urls } = await request.json();

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: "URLs are required" }, { status: 400 });
    }

    const parsedFeeds = await Promise.all(
      urls.map(async (url) => {
        try {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(
              `Failed to fetch iCal feed: ${response.statusText}`,
            );
          }
          const buffer = await response.arrayBuffer();
          const data = decodeFeed(buffer);
          return ICAL.parse(data);
        } catch (err) {
          console.error(`Error parsing feed ${url}:`, err);
          throw err;
        }
      }),
    );

    return NextResponse.json({
      courses: extractCourses(parsedFeeds),
    });
  } catch (error) {
    console.error("Error parsing feed:", error);
    return NextResponse.json(
      { error: "Failed to parse iCal feed. Please check the URL." },
      { status: 500 },
    );
  }
}

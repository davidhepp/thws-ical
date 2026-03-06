import { NextResponse } from "next/server";
import { db } from "@/db";
import { feeds } from "@/db/schema";

export async function POST(request: Request) {
  try {
    const { urls, selectedCourses, selectedGroups } = await request.json();

    if (
      !urls ||
      !Array.isArray(urls) ||
      urls.length === 0 ||
      !selectedCourses ||
      !Array.isArray(selectedCourses)
    ) {
      return NextResponse.json(
        { error: "Invalid input data" },
        { status: 400 },
      );
    }

    const originalUrl = urls[0];
    const additionalUrls = urls.length > 1 ? urls.slice(1) : [];

    const [newFeed] = await db
      .insert(feeds)
      .values({
        originalUrl,
        additionalUrls: additionalUrls.length > 0 ? additionalUrls : null,
        selectedCourses,
        selectedGroups: selectedGroups && Object.keys(selectedGroups).some(course => selectedGroups[course]?.length > 0) ? selectedGroups : null,
      })
      .returning();

    return NextResponse.json({ id: newFeed.id });
  } catch (error) {
    console.error("Error saving feed:", error);
    return NextResponse.json(
      { error: "Failed to save feed configuration." },
      { status: 500 },
    );
  }
}

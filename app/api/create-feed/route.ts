import { NextResponse } from "next/server";
import { db } from "@/db";
import { feeds } from "@/db/schema";

export async function POST(request: Request) {
  try {
    const { originalUrl, selectedCourses } = await request.json();

    if (!originalUrl || !selectedCourses || !Array.isArray(selectedCourses)) {
      return NextResponse.json(
        { error: "Invalid input data" },
        { status: 400 },
      );
    }

    const [newFeed] = await db
      .insert(feeds)
      .values({
        originalUrl,
        selectedCourses,
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

import { NextResponse } from "next/server";
import ICAL from "ical.js";
import icalGenerator from "ical-generator";
import { db } from "@/db";
import { feeds } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const [feedConfig] = await db.select().from(feeds).where(eq(feeds.id, id));

    if (!feedConfig) {
      return new NextResponse("Feed not found", { status: 404 });
    }

    const response = await fetch(feedConfig.originalUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch original feed.`);
    }
    const buffer = await response.arrayBuffer();
    let data = "";
    try {
      data = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    } catch (e) {
      data = new TextDecoder("iso-8859-1").decode(buffer);
    }
    const jcalData = ICAL.parse(data);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents("vevent");

    const calendar = icalGenerator({
      name: "Filtered University Schedule",
      timezone: "Europe/Berlin",
    });

    const selectedCoursesSet = new Set(feedConfig.selectedCourses);

    for (const vevent of vevents) {
      const event = new ICAL.Event(vevent);
      const summary = event.summary;

      if (summary && selectedCoursesSet.has(summary)) {
        calendar.createEvent({
          start: event.startDate.toJSDate(),
          end: event.endDate.toJSDate(),
          summary: summary,
          description: event.description,
          location: event.location,
        });
      }
    }

    // Return the generated iCal feed
    return new NextResponse(calendar.toString(), {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'attachment; filename="filtered-schedule.ics"',
      },
    });
  } catch (error) {
    console.error("Error generating feed:", error);
    return new NextResponse("Failed to generate feed", { status: 500 });
  }
}

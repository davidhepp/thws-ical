import { NextResponse } from "next/server";
import ICAL from "ical.js";
import icalGenerator from "ical-generator";
import { DateTime } from "luxon";
import { db } from "@/db";
import { feeds } from "@/db/schema";
import { eq } from "drizzle-orm";

function safeLuxonZone(tzid: string | undefined, fallback = "Europe/Berlin") {
  if (!tzid) return fallback;
  // Luxon/IANA zone validation
  const test = DateTime.now().setZone(tzid);
  return test.isValid ? tzid : fallback;
}

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
      return new NextResponse("Failed to fetch original feed", { status: 502 });
    }

    const buffer = await response.arrayBuffer();
    let data = "";
    try {
      data = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    } catch {
      data = new TextDecoder("iso-8859-1").decode(buffer);
    }

    const jcalData = ICAL.parse(data);
    const comp = new ICAL.Component(jcalData);

    // Reuse the source VTIMEZONE (best compatibility for clients)
    const vtz = comp.getFirstSubcomponent("vtimezone");
    const vtzString = vtz ? vtz.toString() : undefined;

    const calendar = icalGenerator({
      name: "Filtered THWS Schedule",
      timezone: vtzString
        ? {
            name: "Europe/Berlin",
            generator: () => vtzString,
          }
        : "Europe/Berlin",
    });

    const selectedCoursesSet = new Set(feedConfig.selectedCourses);

    const vevents = comp.getAllSubcomponents("vevent");
    for (const vevent of vevents) {
      const event = new ICAL.Event(vevent);
      const summary = event.summary;

      if (!summary || !selectedCoursesSet.has(summary)) continue;

      const s = event.startDate;
      const e = event.endDate;

      // Prefer the event's TZID if present; otherwise fallback to Europe/Berlin
      const eventTzidRaw =
        (s && (s.zone?.tzid as string | undefined)) ?? "Europe/Berlin";
      const eventTzid = safeLuxonZone(eventTzidRaw, "Europe/Berlin");

      // IMPORTANT: keep wall-clock components; do NOT call toJSDate()
      const start = DateTime.fromObject(
        {
          year: s.year,
          month: s.month,
          day: s.day,
          hour: s.hour,
          minute: s.minute,
          second: s.second,
        },
        { zone: eventTzid },
      );

      const end = DateTime.fromObject(
        {
          year: e.year,
          month: e.month,
          day: e.day,
          hour: e.hour,
          minute: e.minute,
          second: e.second,
        },
        { zone: eventTzid },
      );

      calendar.createEvent({
        start,
        end,
        timezone: eventTzid, // ensures DTSTART/DTEND keep TZID
        summary,
        description: event.description,
        location: event.location,
      });
    }

    return new NextResponse(calendar.toString(), {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        // inline is often nicer for subscription URLs; keep attachment if you want downloads
        "Content-Disposition": 'inline; filename="filtered-schedule.ics"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error generating feed:", error);
    return new NextResponse("Failed to generate feed", { status: 500 });
  }
}

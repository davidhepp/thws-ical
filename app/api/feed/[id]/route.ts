import { NextResponse } from "next/server";
import ICAL from "ical.js";
import icalGenerator from "ical-generator";
import { DateTime } from "luxon";
import { db } from "@/db";
import { feeds } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Redis } from "@upstash/redis";

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

    const urlParts = feedConfig.originalUrl.split("/");
    const lastSegment = urlParts.pop() || "schedule";
    const baseName = lastSegment.endsWith(".ics")
      ? lastSegment.slice(0, -4)
      : lastSegment;
    const filename = `${baseName}_filtered.ics`;

    const cacheKey = `feed:${id}`;
    let redis: Redis | null = null;
    try {
      redis = Redis.fromEnv();
      const cachedCalendar = await redis.get<string>(cacheKey);
      if (cachedCalendar) {
        return new NextResponse(cachedCalendar, {
          headers: {
            "Content-Type": "text/calendar; charset=utf-8",
            "Content-Disposition": `inline; filename="${filename}"`,
            "Cache-Control": "public, s-maxage=900, stale-while-revalidate=60",
          },
        });
      }
    } catch (e) {
      console.warn("Redis caching error:", e);
    }

    const urlsToFetch = [
      feedConfig.originalUrl,
      ...(feedConfig.additionalUrls || []),
    ];

    const feedResponses = await Promise.all(
      urlsToFetch.map(async (url) => {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch original feed from ${url}`);
        }
        const buffer = await response.arrayBuffer();
        let data = "";
        try {
          data = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
        } catch {
          data = new TextDecoder("iso-8859-1").decode(buffer);
        }
        return ICAL.parse(data);
      }),
    );

    let vtzString: string | undefined;

    // Use timezone from the first feed if available
    if (feedResponses.length > 0) {
      const comp = new ICAL.Component(feedResponses[0]);
      const vtz = comp.getFirstSubcomponent("vtimezone");
      if (vtz) {
        vtzString = vtz.toString();
      }
    }

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

    for (const jcalData of feedResponses) {
      const comp = new ICAL.Component(jcalData);
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
    }

    const calendarString = calendar.toString();

    if (redis) {
      try {
        await redis.set(cacheKey, calendarString, { ex: 900 });
      } catch (e) {
        console.warn("Error setting redis cache:", e);
      }
    }

    return new NextResponse(calendarString, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "public, s-maxage=900, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("Error generating feed:", error);
    return new NextResponse("Failed to generate feed", { status: 500 });
  }
}

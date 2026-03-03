import { NextResponse } from "next/server";
import ICAL from "ical.js";

export async function POST(request: Request) {
  try {
    const { urls } = await request.json();

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: "URLs are required" }, { status: 400 });
    }

    const uniqueCourses = new Set<string>();

    await Promise.all(
      urls.map(async (url) => {
        try {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(
              `Failed to fetch iCal feed: ${response.statusText}`,
            );
          }
          const buffer = await response.arrayBuffer();
          let data = "";
          try {
            data = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
          } catch {
            // Fallback for iCal feeds using legacy encodings
            data = new TextDecoder("iso-8859-1").decode(buffer);
          }
          const jcalData = ICAL.parse(data);
          const comp = new ICAL.Component(jcalData);
          const vevents = comp.getAllSubcomponents("vevent");

          for (const vevent of vevents) {
            const event = new ICAL.Event(vevent);
            const summaryText = event.summary;
            if (summaryText) {
              uniqueCourses.add(summaryText);
            }
          }
        } catch (err) {
          console.error(`Error parsing feed ${url}:`, err);
          throw err;
        }
      }),
    );

    return NextResponse.json({
      courses: Array.from(uniqueCourses).sort(),
    });
  } catch (error) {
    console.error("Error parsing feed:", error);
    return NextResponse.json(
      { error: "Failed to parse iCal feed. Please check the URL." },
      { status: 500 },
    );
  }
}

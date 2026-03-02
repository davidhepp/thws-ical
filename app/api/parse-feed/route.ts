import { NextResponse } from "next/server";
import ICAL from "ical.js";

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch iCal feed: ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    let data = "";
    try {
      data = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    } catch (e) {
      // Fallback for iCal feeds using legacy encodings like the THWS one
      data = new TextDecoder("iso-8859-1").decode(buffer);
    }
    const jcalData = ICAL.parse(data);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents("vevent");

    const uniqueCourses = new Set<string>();

    for (const vevent of vevents) {
      const event = new ICAL.Event(vevent);
      const summaryText = event.summary;
      if (summaryText) {
        uniqueCourses.add(summaryText);
      }
    }

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

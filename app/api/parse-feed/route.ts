import { NextResponse } from "next/server";
import ICAL from "ical.js";
import { decodeFeed } from "@/lib/ical/decodeFeed";
import { extractCourses } from "@/lib/ical/extractCourses";

function extractGroupsFromText(text?: string) {
  if (!text) return [] as string[];
  const groups = new Set<string>();

  const patterns = [
    /Gruppe[s]?\s*[:\-]\s*([A-Za-z0-9\/_\-, ]+)/gi,
    /Gr\.\s*[:\-]\s*([A-Za-z0-9\/_\-, ]+)/gi,
    /\bGruppe\b\s+([A-Za-z0-9\/_\-]+)/gi,
    /\bGr\b\.?\s+([A-Za-z0-9\/_\-]+)/gi,
  ];

  for (const p of patterns) {
    let m;
    while ((m = p.exec(text))) {
      if (m[1]) {
        m[1]
          .split(/[,;\/]/)
          .map((s) => s.trim())
          .filter((g) => g.length >= 2 && !/^[-_\s]*$/.test(g) && /[A-Za-z0-9]/.test(g))
          .map((g) => g.replace(/^Gruppe\s+/i, ""))
          .forEach((g) => groups.add(g));
      }
    }
  }

  const paren = /\(([A-Za-z0-9\-_/]+)\)/g;
  let pm;
  while ((pm = paren.exec(text))) {
    const token = pm[1];
    if (token && token.length >= 2 && !/^[-_\s]*$/.test(token) && /[A-Za-z0-9]/.test(token)) {
      groups.add(token);
    }
  }

  return Array.from(groups);
}

export async function POST(request: Request) {
  try {
    const { urls } = await request.json();
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: "URLs are required" }, { status: 400 });
    }

    const uniqueCourses = new Set<string>();
    const allGroups = new Set<string>();
    const courseGroups: Record<string, Set<string>> = {};

    const parsedFeeds = await Promise.all(
      urls.map(async (url) => {
        try {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Failed to fetch iCal feed: ${response.statusText}`);
          }
          const buffer = await response.arrayBuffer();
          const data = decodeFeed(buffer);
          const jcalData = ICAL.parse(data);

          // Extract groups per course
          const comp = new ICAL.Component(jcalData);
          const vevents = comp.getAllSubcomponents("vevent");
          for (const vevent of vevents) {
            const event = new ICAL.Event(vevent);
            const summaryText = event.summary;
            if (summaryText) {
              uniqueCourses.add(summaryText);
              const groups = extractGroupsFromText(event.description);
              if (groups.length > 0) {
                courseGroups[summaryText] = courseGroups[summaryText] || new Set();
                for (const g of groups) {
                  courseGroups[summaryText].add(g);
                  allGroups.add(g);
                }
              }
            }
          }

          return jcalData;
        } catch (err) {
          console.error(`Error parsing feed ${url}:`, err);
          throw err;
        }
      }),
    );

    const courseGroupsObj: Record<string, string[]> = {};
    for (const k of Object.keys(courseGroups)) {
      courseGroupsObj[k] = Array.from(courseGroups[k]).sort();
    }

    return NextResponse.json({
      courses: extractCourses(parsedFeeds),
      groups: Array.from(allGroups).sort(),
      courseGroups: courseGroupsObj,
    });
  } catch (error) {
    console.error("Error parsing feed:", error);
    return NextResponse.json(
      { error: "Failed to parse iCal feed. Please check the URL." },
      { status: 500 },
    );
  }
}
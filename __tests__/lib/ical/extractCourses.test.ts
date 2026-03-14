import { describe, it, expect } from "vitest";
import ICAL from "ical.js";
import { extractCourses } from "@/lib/ical/extractCourses";

describe("extractCourses", () => {
  it("should extract unique course names, ignoring duplicates and events without summary, and sort them", () => {
    const icalString = `BEGIN:VCALENDAR
BEGIN:VEVENT
SUMMARY:Mathematics
END:VEVENT
BEGIN:VEVENT
SUMMARY:Physics
END:VEVENT
BEGIN:VEVENT
SUMMARY:Mathematics
END:VEVENT
BEGIN:VEVENT
DESCRIPTION:No summary here
END:VEVENT
BEGIN:VEVENT
SUMMARY:Computer Science
END:VEVENT
END:VCALENDAR`;

    const jcalData = ICAL.parse(icalString);
    const courses = extractCourses([jcalData]);

    expect(courses).toEqual(["Computer Science", "Mathematics", "Physics"]);
  });

  it("should handle multiple feeds correctly", () => {
    const feed1 = `BEGIN:VCALENDAR\nBEGIN:VEVENT\nSUMMARY:Course A\nEND:VEVENT\nEND:VCALENDAR`;
    const feed2 = `BEGIN:VCALENDAR\nBEGIN:VEVENT\nSUMMARY:Course B\nEND:VEVENT\nBEGIN:VEVENT\nSUMMARY:Course A\nEND:VEVENT\nEND:VCALENDAR`;

    const jcal1 = ICAL.parse(feed1);
    const jcal2 = ICAL.parse(feed2);

    const courses = extractCourses([jcal1, jcal2]);
    expect(courses).toEqual(["Course A", "Course B"]);
  });
});

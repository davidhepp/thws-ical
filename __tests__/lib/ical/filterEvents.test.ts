import { describe, it, expect } from "vitest";
import ICAL from "ical.js";
import { filterEvents } from "@/lib/ical/filterEvents";

describe("filterEvents", () => {
  it("should only include chosen summaries and exclude unselected or missing summaries", () => {
    const icalString = `BEGIN:VCALENDAR
BEGIN:VEVENT
SUMMARY:Keep Me
END:VEVENT
BEGIN:VEVENT
SUMMARY:Drop Me
END:VEVENT
BEGIN:VEVENT
DESCRIPTION:No summary here
END:VEVENT
BEGIN:VEVENT
SUMMARY:Keep Me Also
END:VEVENT
END:VCALENDAR`;

    const jcalData = ICAL.parse(icalString);
    const events = filterEvents([jcalData], ["Keep Me", "Keep Me Also"]);

    expect(events).toHaveLength(2);
    expect(events[0].summary).toBe("Keep Me");
    expect(events[1].summary).toBe("Keep Me Also");
  });
});

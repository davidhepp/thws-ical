import ICAL from "ical.js";

/**
 * Extracts unique, sorted course names from an array of parsed jCal data objects.
 * Ignores events without a summary.
 */
// note: has to be any[] because ical.js returns nested arrays
export function extractCourses(jcalDataArray: any[]): string[] {
  const uniqueCourses = new Set<string>();

  for (const jcalData of jcalDataArray) {
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents("vevent");

    for (const vevent of vevents) {
      const event = new ICAL.Event(vevent);
      const summaryText = event.summary;
      if (summaryText) {
        uniqueCourses.add(summaryText);
      }
    }
  }

  return Array.from(uniqueCourses).sort();
}

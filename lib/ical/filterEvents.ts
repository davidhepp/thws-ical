import ICAL from "ical.js";

/**
 * Returns an array of ICAL.Event objects that match the selected courses.
 * Excludes events without a summary or whose summary isn't selected.
 */
export function filterEvents(
  jcalDataArray: any[],
  selectedCourses: string[] | Set<string>,
): ICAL.Event[] {
  const selected =
    selectedCourses instanceof Set ? selectedCourses : new Set(selectedCourses);
  const filtered: ICAL.Event[] = [];

  for (const jcalData of jcalDataArray) {
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents("vevent");

    for (const vevent of vevents) {
      const event = new ICAL.Event(vevent);
      const summary = event.summary;

      if (!summary || !selected.has(summary)) {
        continue;
      }

      filtered.push(event);
    }
  }

  return filtered;
}

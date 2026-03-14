import { DateTime } from "luxon";

export function safeLuxonZone(
  tzid: string | undefined,
  fallback = "Europe/Berlin",
) {
  if (!tzid) return fallback;
  // Luxon/IANA zone validation
  const test = DateTime.now().setZone(tzid);
  return test.isValid ? tzid : fallback;
}

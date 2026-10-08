export interface TimezoneOption {
  value: string;
  label: string;
  country: string;
}

export const COMMON_TIMEZONES: TimezoneOption[] = [
  { value: "America/Lima", label: "Peru", country: "Peru" },
  { value: "America/Bogota", label: "Colombia", country: "Colombia" },
  { value: "America/Mexico_City", label: "Mexico City", country: "Mexico" },
  { value: "America/Santiago", label: "Chile", country: "Chile" },
  { value: "America/Argentina/Buenos_Aires", label: "Argentina", country: "Argentina" },
  { value: "America/Sao_Paulo", label: "Brazil (Sao Paulo)", country: "Brazil" },
  { value: "America/Caracas", label: "Venezuela", country: "Venezuela" },
  { value: "America/Guayaquil", label: "Ecuador", country: "Ecuador" },
  { value: "America/La_Paz", label: "Bolivia", country: "Bolivia" },
  { value: "America/Asuncion", label: "Paraguay", country: "Paraguay" },
  { value: "America/Montevideo", label: "Uruguay", country: "Uruguay" },
  { value: "America/Panama", label: "Panama", country: "Panama" },
  { value: "America/Costa_Rica", label: "Costa Rica", country: "Costa Rica" },
  { value: "America/El_Salvador", label: "El Salvador", country: "El Salvador" },
  { value: "America/Guatemala", label: "Guatemala", country: "Guatemala" },
  { value: "America/Tegucigalpa", label: "Honduras", country: "Honduras" },
  { value: "America/Managua", label: "Nicaragua", country: "Nicaragua" },
  { value: "America/Santo_Domingo", label: "Dominican Republic", country: "Dominican Republic" },
  { value: "America/Puerto_Rico", label: "Puerto Rico", country: "Puerto Rico" },
  { value: "America/Havana", label: "Cuba", country: "Cuba" },
  { value: "America/New_York", label: "United States (Eastern)", country: "United States" },
  { value: "America/Chicago", label: "United States (Central)", country: "United States" },
  { value: "America/Denver", label: "United States (Mountain)", country: "United States" },
  { value: "America/Los_Angeles", label: "United States (Pacific)", country: "United States" },
  { value: "America/Toronto", label: "Canada (Eastern)", country: "Canada" },
  { value: "America/Vancouver", label: "Canada (Pacific)", country: "Canada" },
  { value: "Europe/Madrid", label: "Spain", country: "Spain" },
  { value: "Europe/London", label: "United Kingdom", country: "United Kingdom" },
  { value: "Europe/Paris", label: "France", country: "France" },
  { value: "Europe/Berlin", label: "Germany", country: "Germany" },
  { value: "Europe/Rome", label: "Italy", country: "Italy" },
  { value: "Europe/Amsterdam", label: "Netherlands", country: "Netherlands" },
  { value: "Europe/Brussels", label: "Belgium", country: "Belgium" },
  { value: "Europe/Zurich", label: "Switzerland", country: "Switzerland" },
  { value: "Europe/Stockholm", label: "Sweden", country: "Sweden" },
  { value: "Europe/Oslo", label: "Norway", country: "Norway" },
  { value: "Europe/Copenhagen", label: "Denmark", country: "Denmark" },
  { value: "Europe/Helsinki", label: "Finland", country: "Finland" },
  { value: "Europe/Warsaw", label: "Poland", country: "Poland" },
  { value: "Europe/Lisbon", label: "Portugal", country: "Portugal" },
  { value: "Europe/Athens", label: "Greece", country: "Greece" },
  { value: "Europe/Istanbul", label: "Turkey", country: "Turkey" },
  { value: "Europe/Moscow", label: "Russia (Moscow)", country: "Russia" },
  { value: "Asia/Tokyo", label: "Japan", country: "Japan" },
  { value: "Asia/Shanghai", label: "China", country: "China" },
  { value: "Asia/Seoul", label: "South Korea", country: "South Korea" },
  { value: "Asia/Singapore", label: "Singapore", country: "Singapore" },
  { value: "Asia/Hong_Kong", label: "Hong Kong", country: "Hong Kong" },
  { value: "Asia/Taipei", label: "Taiwan", country: "Taiwan" },
  { value: "Asia/Bangkok", label: "Thailand", country: "Thailand" },
  { value: "Asia/Jakarta", label: "Indonesia", country: "Indonesia" },
  { value: "Asia/Manila", label: "Philippines", country: "Philippines" },
  { value: "Asia/Ho_Chi_Minh", label: "Vietnam", country: "Vietnam" },
  { value: "Asia/Kuala_Lumpur", label: "Malaysia", country: "Malaysia" },
  { value: "Asia/Kolkata", label: "India", country: "India" },
  { value: "Asia/Karachi", label: "Pakistan", country: "Pakistan" },
  { value: "Asia/Dhaka", label: "Bangladesh", country: "Bangladesh" },
  { value: "Asia/Dubai", label: "United Arab Emirates", country: "United Arab Emirates" },
  { value: "Asia/Riyadh", label: "Saudi Arabia", country: "Saudi Arabia" },
  { value: "Asia/Jerusalem", label: "Israel", country: "Israel" },
  { value: "Australia/Sydney", label: "Australia (Sydney)", country: "Australia" },
  { value: "Australia/Melbourne", label: "Australia (Melbourne)", country: "Australia" },
  { value: "Australia/Perth", label: "Australia (Perth)", country: "Australia" },
  { value: "Pacific/Auckland", label: "New Zealand", country: "New Zealand" },
  { value: "Africa/Cairo", label: "Egypt", country: "Egypt" },
  { value: "Africa/Lagos", label: "Nigeria", country: "Nigeria" },
  { value: "Africa/Johannesburg", label: "South Africa", country: "South Africa" },
  { value: "Africa/Nairobi", label: "Kenya", country: "Kenya" },
  { value: "Africa/Casablanca", label: "Morocco", country: "Morocco" },
  { value: "UTC", label: "UTC (Coordinated Universal Time)", country: "Worldwide" },
];

export const DEFAULT_TIMEZONE = "America/Lima";

export function searchTimezones(query: string): TimezoneOption[] {
  if (!query || query.trim().length === 0) return COMMON_TIMEZONES;
  const q = query.toLowerCase().trim();
  return COMMON_TIMEZONES.filter(
    (tz) =>
      tz.label.toLowerCase().includes(q) ||
      tz.value.toLowerCase().includes(q) ||
      tz.country.toLowerCase().includes(q)
  );
}

export function getTimezoneLabel(value: string | null | undefined): string {
  if (!value) return "";
  const found = COMMON_TIMEZONES.find((tz) => tz.value === value);
  return found ? `${found.label} (${found.value})` : value;
}

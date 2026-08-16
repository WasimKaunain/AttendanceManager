// ======================================================
// Date & Time
// ======================================================

export function formatDateTime(dateString) {
  if (!dateString) return "-";

  return new Date(dateString).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}


// ======================================================
// Numbers
// ======================================================

export function formatScore(value, decimals = 3) {
  if (value === null || value === undefined) return "-";

  return Number(value).toFixed(decimals);
}

export function formatDistance(value) {
  if (value === null || value === undefined) return "-";

  return `${Number(value).toFixed(2)} m`;
}

export function formatCoordinate(value) {
  if (value === null || value === undefined) return "-";

  return Number(value).toFixed(6);
}


// ======================================================
// Percentage
// ======================================================

export function formatPercentage(value, decimals = 1) {
  if (value === null || value === undefined) return "-";

  return `${Number(value).toFixed(decimals)}%`;
}


// ======================================================
// Generic
// ======================================================

export function formatValue(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "-";
  }

  return value;
}

export function formatEventType(event) {
  if (!event) return "-";

  return event
    .replaceAll("_", " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}
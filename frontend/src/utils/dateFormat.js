/**
 * Utility functions for consistent date & time formatting across charts,
 * tooltips, axes, and timeline ledgers in SilentNeed AI.
 * 
 * Format: "22 Oct 2026, 10:30 AM"
 */

export function formatDateTime(isoString) {
  if (!isoString) return "N/A";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "N/A";
  
  const day = date.getDate().toString().padStart(2, '0');
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strHours = hours.toString().padStart(2, '0');
  
  return `${day} ${month} ${year}, ${strHours}:${minutes} ${ampm}`;
}

export function formatShortDateTime(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "";
  
  const day = date.getDate().toString().padStart(2, '0');
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[date.getMonth()];
  
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  
  return `${day} ${month}, ${hours}:${minutes} ${ampm}`;
}

export function formatRelativeSilence(days) {
  if (days === null || days === undefined) return "Never reported";
  const d = Math.round(days * 10) / 10;
  if (d === 0) return "Active today (0 days silent)";
  if (d === 1) return "1 day silent";
  return `${d} days silent`;
}

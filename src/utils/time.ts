export const nowIso = () => new Date().toISOString();

export const todayYMD = (): string => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Get yesterday's date in YYYY-MM-DD format
 * @returns String in format: YYYY-MM-DD
 */
export const yesterdayYMD = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1); // Subtract one day
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// Convert an ISO timestamp to local date string (YYYY-MM-DD)
export const isoToLocalYMD = (isoString: string): string => {
  const d = new Date(isoString);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Get a time key that changes every 5 minutes
 * Used for rotating quotes/content that should update every 5 minutes
 * @returns String in format: YYYY-MM-DD-HH-MM (rounded to 5-minute intervals)
 */
export function getFiveMinuteInterval(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  // Round minutes down to nearest 5-minute interval (0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55)
  const minutes = String(Math.floor(d.getMinutes() / 5) * 5).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}-${hours}-${minutes}`;
}


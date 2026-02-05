const MINUTE_SECONDS = 60;
const HOUR_SECONDS = 60 * MINUTE_SECONDS;
const DAY_SECONDS = 24 * HOUR_SECONDS;
const WEEK_SECONDS = 7 * DAY_SECONDS;
const MONTH_SECONDS = 30 * DAY_SECONDS;
const YEAR_SECONDS = 365 * DAY_SECONDS;

export const formatRelativeTime = (isoDate: string, now = new Date()): string => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const diffSeconds = Math.max(
    0,
    Math.floor((now.getTime() - date.getTime()) / 1000)
  );

  if (diffSeconds < MINUTE_SECONDS) {
    return "now";
  }
  if (diffSeconds < HOUR_SECONDS) {
    return `${Math.floor(diffSeconds / MINUTE_SECONDS)} min`;
  }
  if (diffSeconds < DAY_SECONDS) {
    return `${Math.floor(diffSeconds / HOUR_SECONDS)} h`;
  }
  if (diffSeconds < WEEK_SECONDS) {
    return `${Math.floor(diffSeconds / DAY_SECONDS)} d`;
  }
  if (diffSeconds < MONTH_SECONDS) {
    return `${Math.floor(diffSeconds / WEEK_SECONDS)} wk`;
  }
  if (diffSeconds < YEAR_SECONDS) {
    return `${Math.floor(diffSeconds / MONTH_SECONDS)} mo`;
  }
  return `${Math.floor(diffSeconds / YEAR_SECONDS)} yr`;
};

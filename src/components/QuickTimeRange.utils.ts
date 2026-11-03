import dayjs, { type Dayjs } from "dayjs";

export const QUICK_TIME_RANGE_OPTIONS = [
  "Last 5 minutes",
  "Last Hour",
  "Last 24 Hours",
  "Today",
  "Yesterday",
  "This Month",
  "Previous Month",
] as const;

export type QuickTimeRangeValue = (typeof QUICK_TIME_RANGE_OPTIONS)[number];

export const DEFAULT_QUICK_TIME_RANGE: QuickTimeRangeValue = "Last 5 minutes";

export const getQuickTimeRange = (
  range: QuickTimeRangeValue,
  now: Dayjs = dayjs(),
) => {
  switch (range) {
    case "Last 5 minutes":
      return { start: now.subtract(5, "minute"), end: now };
    case "Last Hour":
      return { start: now.subtract(1, "hour"), end: now };
    case "Last 24 Hours":
      return { start: now.subtract(24, "hour"), end: now };
    case "Today":
      return { start: now.startOf("day"), end: now };
    case "Yesterday": {
      const yesterday = now.subtract(1, "day");
      return { start: yesterday.startOf("day"), end: yesterday.endOf("day") };
    }
    case "This Month":
      return { start: now.startOf("month"), end: now };
    case "Previous Month": {
      const previousMonth = now.subtract(1, "month");
      return {
        start: previousMonth.startOf("month"),
        end: previousMonth.endOf("month"),
      };
    }
  }
};

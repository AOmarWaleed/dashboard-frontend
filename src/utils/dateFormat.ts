import dayjs, { type Dayjs } from "dayjs";

export const API_DATE_TIME_FORMAT = "YYYY-MM-DD HH:mm:ss";
export const API_DATE_TIME_MINUTES_FORMAT = "YYYY-MM-DD HH:mm";
export const DISPLAY_DATE_TIME_FORMAT = "DD-MM-YYYY HH:mm:ss";

export type DateFormat =
  | typeof API_DATE_TIME_FORMAT
  | typeof API_DATE_TIME_MINUTES_FORMAT
  | typeof DISPLAY_DATE_TIME_FORMAT
  | (string & Record<never, never>);

export type DateValue = Dayjs | string | null | undefined;

export const formatDateTime = (
  value: DateValue,
  format: DateFormat = API_DATE_TIME_FORMAT,
): string | undefined => {
  if (!value) return undefined;

  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format(format) : undefined;
};

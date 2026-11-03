import { useEffect, useState } from "react";
import { DesktopDateTimePicker } from "@mui/x-date-pickers/DesktopDateTimePicker";
import type { TextFieldProps } from "@mui/material";
import type { Dayjs } from "dayjs";
import type { FormikLike } from "./FormikTextFilter";
import { dashboardAxios } from "../api";
import {
  DISPLAY_DATE_TIME_FORMAT,
  type DateFormat,
} from "../utils/dateFormat";

interface FormikDateTimeFilterProps {
  name: string;
  label: string;
  formik: FormikLike;
  format?: DateFormat;
  minDate?: Dayjs | null;
  size?: "small" | "medium";
  fullWidth?: boolean;
  textFieldProps?: TextFieldProps;
  onChange?: (value: Dayjs | null) => void;
  resetDate?: () => void;
}

export default function FormikDateTimeFilter({
  name,
  label,
  formik,
  format = DISPLAY_DATE_TIME_FORMAT,
  minDate,
  size = "small",
  fullWidth = true,
  textFieldProps,
  onChange,
  resetDate,
  ...props
}: FormikDateTimeFilterProps) {
  const error = formik.touched?.[name] && formik.errors?.[name];
  const [formatBackEnd, setFormatBackEnd] = useState(format);

  // get the frontend date-time format from the backend and use it for the picker
  useEffect(() => {
    async function fetchFormate() {
      try {
        const { data } = await dashboardAxios.get("/conf/TIMESTAMP_FORMAT_FRONT");
        const backendFormat = data?.conf_value;
        setFormatBackEnd(backendFormat);
      } catch (error) {
        console.error("Error fetching date-time format:", error);
      }
    }
    fetchFormate();
  }, []);

  return (
    <DesktopDateTimePicker
      label={label}
      format={formatBackEnd}
      value={formik.values?.[name] ?? null}
      onChange={(value) => {
        formik.setFieldValue(name, value);
        onChange?.(value ?? null);
      }}
      minDate={minDate ?? undefined}
      slotProps={{
        ...(resetDate && {
          field: { clearable: true, onClear: () => resetDate() },
        }),
        textField: {
          size,
          fullWidth,
          error: Boolean(error),
          helperText: error || "",
          ...textFieldProps,
        },
      }}
      {...props}
    />
  );
}

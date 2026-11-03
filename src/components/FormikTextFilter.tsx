import React from "react";
import { TextField } from "@mui/material";
import type { TextFieldProps } from "@mui/material";

export interface FormikLike {
  values: Record<string, any>;
  errors: Record<string, any>;
  touched: Record<string, any>;
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
  handleChange?: (event: React.ChangeEvent<any>) => void;
  handleBlur?: (event: React.FocusEvent<any>) => void;
}

interface FormikTextFilterProps {
  name: string;
  label: string;
  formik: FormikLike;
  size?: "small" | "medium";
  fullWidth?: boolean;
  disabled?: boolean;
  textFieldProps?: TextFieldProps;
}

export default function FormikTextFilter({
  name,
  label,
  formik,
  size = "small",
  fullWidth = true,
  disabled = false,
  textFieldProps,
}: FormikTextFilterProps) {
  const error = formik.touched?.[name] && formik.errors?.[name];

  return (
    <TextField
      name={name}
      label={label}
      size={size}
      fullWidth={fullWidth}
      value={formik.values?.[name] ?? ""}
      onChange={formik.handleChange}
      onBlur={formik.handleBlur}
      disabled={disabled}
      error={Boolean(error)}
      helperText={error || ""}
      {...textFieldProps}
    />
  );
}

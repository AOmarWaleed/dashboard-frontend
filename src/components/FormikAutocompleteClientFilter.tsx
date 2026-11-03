import React, { useMemo } from "react";
import { Autocomplete, TextField } from "@mui/material";
import type {
  AutocompleteRenderOptionState,
  SxProps,
  TextFieldProps,
  Theme,
} from "@mui/material";
import type { FormikLike } from "./FormikTextFilter";

interface FormikAutocompleteClientFilterProps<OptionType, ValueType = any> {
  name: string;
  label: string;
  formik: FormikLike;
  options: OptionType[];
  getOptionLabel: (option: OptionType) => string;
  getOptionValue?: (option: OptionType) => ValueType;
  renderOption?: (
    props: React.HTMLAttributes<HTMLLIElement>,
    option: OptionType,
    state: AutocompleteRenderOptionState
  ) => React.ReactNode;
  listboxSx?: SxProps<Theme>;
  size?: "small" | "medium";
  fullWidth?: boolean;
  disabled?: boolean;
  textFieldProps?: TextFieldProps;
}

export default function FormikAutocompleteClientFilter<
  OptionType,
  ValueType = any
>({
  name,
  label,
  formik,
  options,
  getOptionLabel,
  getOptionValue,
  renderOption,
  listboxSx,
  size = "small",
  fullWidth = true,
  disabled = false,
  textFieldProps,
}: FormikAutocompleteClientFilterProps<OptionType, ValueType>) {
  const error = formik.touched?.[name] && formik.errors?.[name];
  const fieldValue = formik.values?.[name];

  const selectedOption = useMemo(() => {
    if (fieldValue == null) return null;
    if (typeof fieldValue === "object") return fieldValue as OptionType;

    if (getOptionValue) {
      return (
        options.find((opt) => getOptionValue(opt) === fieldValue) || null
      );
    }

    return (options.find((opt) => opt === fieldValue) as OptionType) || null;
  }, [fieldValue, options, getOptionValue]);

  const isOptionEqualToValue = (option: OptionType, value: OptionType) => {
    if (getOptionValue) {
      return getOptionValue(option) === getOptionValue(value);
    }
    return option === value;
  };

  return (
    <Autocomplete
      fullWidth={fullWidth}
      size={size}
      options={options}
      getOptionLabel={getOptionLabel}
      value={selectedOption}
      onChange={(_, value) => {
        if (getOptionValue) {
          formik.setFieldValue(name, value ? getOptionValue(value) : null);
        } else {
          formik.setFieldValue(name, value ?? null);
        }
      }}
      disabled={disabled}
      renderOption={renderOption}
      ListboxProps={{
        sx: listboxSx,
      }}
      isOptionEqualToValue={isOptionEqualToValue}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          size={size}
          fullWidth={fullWidth}
          error={Boolean(error)}
          helperText={error || ""}
          {...textFieldProps}
        />
      )}
    />
  );
}

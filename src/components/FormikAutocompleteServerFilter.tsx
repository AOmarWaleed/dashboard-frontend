import React from "react";
import { Autocomplete, TextField } from "@mui/material";
import type {
  AutocompleteRenderOptionState,
  SxProps,
  TextFieldProps,
  Theme,
} from "@mui/material";
import type { FormikLike } from "./FormikTextFilter";

interface FormikAutocompleteServerFilterProps<OptionType> {
  name: string;
  label: string;
  formik: FormikLike;
  options: OptionType[];
  getOptionLabel: (option: OptionType) => string;
  onInputChange?: (value: string) => void;
  loading?: boolean;
  renderOption?: (
    props: React.HTMLAttributes<HTMLLIElement>,
    option: OptionType,
    state: AutocompleteRenderOptionState,
  ) => React.ReactNode;
  listboxSx?: SxProps<Theme>;
  minWidth?: number | string;
  size?: "small" | "medium";
  fullWidth?: boolean;
  disabled?: boolean;
  textFieldProps?: TextFieldProps;
  startAdornment?: React.ReactNode;
  isOptionEqualToValue?: (option: OptionType, value: OptionType) => boolean;
  disableClearable?: boolean;
}

export default function FormikAutocompleteServerFilter<OptionType>({
  name,
  label,
  formik,
  options,
  getOptionLabel,
  onInputChange,
  loading = false,
  renderOption,
  listboxSx,
  minWidth,
  size = "small",
  fullWidth = true,
  disabled = false,
  textFieldProps,
  startAdornment,
  isOptionEqualToValue,
  ...props
}: FormikAutocompleteServerFilterProps<OptionType>) {
  const error = formik.touched?.[name] && formik.errors?.[name];

  // Always include the selected value in the options list if not present
  const value = formik.values?.[name] ?? null;
  const compare =
    isOptionEqualToValue || ((a: OptionType, b: OptionType) => a === b);
  let mergedOptions = options;
  if (value && !options.some((o) => compare(o, value))) {
    mergedOptions = [value, ...options];
  }

  return (
    <Autocomplete
      {...props}
      fullWidth={fullWidth}
      size={size}
      options={mergedOptions}
      getOptionLabel={getOptionLabel}
      loading={loading}
      value={value}
      filterOptions={(x) => x}
      onChange={(_, value) => {
        formik.setFieldValue(name, value ?? null);
      }}
      onInputChange={(_, value) => {
        onInputChange?.(value);
      }}
      disabled={disabled}
      renderOption={renderOption}
      slotProps={{
        popper: {
          sx: {
            ...(minWidth && {
              width: minWidth + " !important",
            }),
          },
        },
      }}
      ListboxProps={{
        sx: {
          ...(listboxSx || {}),
          ...(minWidth ? { minWidth, overflowX: "auto" } : {}),
        },
      }}
      renderInput={(params) => {
        const mergedInputProps = {
          ...params.InputProps,
          ...textFieldProps?.InputProps,
          startAdornment:
            textFieldProps?.InputProps?.startAdornment ??
            startAdornment ??
            params.InputProps.startAdornment,
        };

        return (
          <TextField
            {...params}
            label={label}
            size={size}
            fullWidth={fullWidth}
            error={Boolean(error)}
            helperText={error || ""}
            {...textFieldProps}
            InputProps={mergedInputProps}
          />
        );
      }}
    />
  );
}

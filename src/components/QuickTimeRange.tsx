import { MenuItem, TextField } from "@mui/material";
import {
  QUICK_TIME_RANGE_OPTIONS,
  type QuickTimeRangeValue,
} from "./QuickTimeRange.utils";

export interface QuickTimeRangeProps {
  value: QuickTimeRangeValue | "";
  onChange: (value: QuickTimeRangeValue) => void;
  size?: "small" | "medium";
}

const QuickTimeRange = ({
  value,
  onChange,
  size = "small",
}: QuickTimeRangeProps) => (
  <TextField
    select
    fullWidth
    label="Quick Time"
    size={size}
    value={value}
    onChange={(event) => onChange(event.target.value as QuickTimeRangeValue)}
  >
    {QUICK_TIME_RANGE_OPTIONS.map((option) => (
      <MenuItem key={option} value={option}>
        {option}
      </MenuItem>
    ))}
  </TextField>
);

export default QuickTimeRange;

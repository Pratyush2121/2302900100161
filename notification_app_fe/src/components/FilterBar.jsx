import {
  FormControl,
  Select,
  MenuItem,
} from "@mui/material";

export default function FilterBar({
  value,
  onChange,
}) {
  return (
    <FormControl fullWidth>
      <Select
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
      >
        <MenuItem value="">
          All
        </MenuItem>

        <MenuItem value="Event">
          Event
        </MenuItem>

        <MenuItem value="Result">
          Result
        </MenuItem>

        <MenuItem value="Placement">
          Placement
        </MenuItem>
      </Select>
    </FormControl>
  );
}
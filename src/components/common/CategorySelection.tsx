import {
  Autocomplete,
  Box,
  Chip,
  TextField,
  autocompleteClasses,
  useTheme,
} from "@mui/material";

interface CategorySelectorProps {
  value: string[];
  onChange: (newValue: string[]) => void;
  label?: string;
}

const PREDEFINED_CATEGORIES = [
  "Math",
  "Science",
  "History",
  "Geography",
  "Literature",
  "Sports",
  "Entertainment",
  "Technology",
  "Art",
  "Music",
];

export default function CategorySelector({
  value,
  onChange,
  label = "Categories",
}: CategorySelectorProps) {
  const theme = useTheme();

  const availableOptions = PREDEFINED_CATEGORIES.filter(
    (option) => !value.includes(option)
  );

  function getColorForTag(tag: string): string {
    // Use theme colors with different shades
    const colors: Record<string, string> = {
      Math: theme.palette.info.main,
      Science: theme.palette.success.main,
      History: theme.palette.warning.main,
      Geography: theme.palette.info.light,
      Literature: theme.palette.secondary.main,
      Sports: theme.palette.error.light,
      Entertainment: theme.palette.secondary.light,
      Technology: theme.palette.primary.dark,
      Art: theme.palette.warning.dark,
      Music: theme.palette.info.dark,
    };
    return colors[tag] || theme.palette.primary.main;
  }

  const handleDelete = (categoryToDelete: string) => {
    onChange(value.filter((cat) => cat !== categoryToDelete));
  };

  return (
    <Box sx={{ my: 2, maxWidth: 400 }}>
      <Autocomplete
        multiple
        freeSolo
        options={availableOptions}
        value={value}
        onChange={(_, newValue) => onChange(newValue)}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            label={label}
            placeholder="Add or select category"
          />
        )}
        // Use renderValue instead of renderTags
        renderTags={(selected: string[], getTagProps) =>
          selected.map((option: string, index: number) => {
            const tagProps = getTagProps({ index });

            return (
              <Chip
                {...tagProps}
                key={option}
                label={option}
                sx={{
                  backgroundColor: getColorForTag(option),
                  color: "white",
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              />
            );
          })
        }
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2,
              boxShadow: 3,
              p: 1,
            },
            elevation: 3,
          },
        }}
        ListboxProps={{
          style: { maxHeight: 200 },
        }}
      />
    </Box>
  );
}
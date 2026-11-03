import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Box,
  Paper,
  Typography,
  useTheme,
} from "@mui/material";
import Draggable from "react-draggable";

type CodeData = {
  code_type: number;
  description: string;
  code: string;
  cat_code?: string[];
  user_code: string;
};

type ValidationDialogProps = {
  open: boolean;
  onClose: () => void;
  validationOptions: CodeData[];
  validationChecks: Record<string, boolean>;
  onValidationChecksChange: (checks: Record<string, boolean>) => void;
  onDetailAisChange?: (detailedAI: boolean) => void;
  onIgnorePreviousChange?: (ignorePrevious: boolean) => void;
};

const DraggablePaper = React.memo((props: any) => {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedPosition = localStorage.getItem("validationDialogPosition");
    if (savedPosition) {
      try {
        const parsed = JSON.parse(savedPosition);
        setPosition(parsed);
      } catch (e) {
        console.error("Error parsing saved position:", e);
        setPosition({ x: 0, y: 0 });
      }
    } else {
      setPosition({ x: 0, y: 0 });
    }
    setMounted(true);
  }, []);

  const handleStop = useCallback((_: any, data: any) => {
    const newPosition = { x: data.x, y: data.y };
    setPosition(newPosition);
    localStorage.setItem(
      "validationDialogPosition",
      JSON.stringify(newPosition),
    );
  }, []);

  if (!mounted) {
    return <Paper {...props} style={{ opacity: 0 }} />;
  }

  return (
    <Draggable
      axis="both"
      handle=".MuiDialogTitle-root"
      cancel={'[class*="MuiDialogContent-root"]'}
      bounds="parent"
      grid={[25, 25]}
      scale={1}
      position={position || { x: 0, y: 0 }}
      onStop={handleStop}
    >
      <Paper {...props} />
    </Draggable>
  );
});

export const ValidationWithOptionsDialog: React.FC<ValidationDialogProps> =
  React.memo(
    ({
      open,
      onClose,
      validationOptions,
      validationChecks,
      onValidationChecksChange,
      onDetailAisChange,
      onIgnorePreviousChange,
    }) => {
      const [searchTerm, setSearchTerm] = useState("");
      const [detailAi, setDetailAi] = useState(false);
      const [ignorePrevious, setIgnorePrevious] = useState(true);
      const {
        palette: { mode },
      } = useTheme();

      const filteredOptions = React.useMemo(
        () =>
          validationOptions.filter((v) =>
            v.description.toLowerCase().includes(searchTerm.toLowerCase()),
          ),
        [validationOptions, searchTerm],
      );

      const handleSelectAll = useCallback(
        (checked: boolean) => {
          const newState = Object.fromEntries(
            Object.keys(validationChecks).map((k) => [k, checked]),
          );
          onValidationChecksChange(newState);
        },
        [validationChecks, onValidationChecksChange],
      );

      const handleCheckboxChange = useCallback(
        (userCode: string, checked: boolean) => {
          onValidationChecksChange({
            ...validationChecks,
            [userCode]: checked,
          });
        },
        [validationChecks, onValidationChecksChange],
      );

      const handleSearchChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
          setSearchTerm(e.target.value);
        },
        [],
      );

      const areAllChecked = Object.values(validationChecks).every(
        (v) => v === true,
      );
      const areSomeChecked =
        Object.values(validationChecks).some((v) => v === true) &&
        !areAllChecked;

      useEffect(() => {
        onDetailAisChange && onDetailAisChange(detailAi);
      }, [detailAi]);

      useEffect(() => {
        onIgnorePreviousChange && onIgnorePreviousChange(ignorePrevious);
      }, [ignorePrevious]);

      useEffect(() => {
        if (open) {
          setSearchTerm("");
          setDetailAi(false);
          setIgnorePrevious(true);
        }
      }, [open]);

      const sortedOptions = [...filteredOptions].sort((a: any, b: any) => {
        const typeCompare = (a.col_3 || "").localeCompare(b.col_3 || "");
        if (typeCompare !== 0) return typeCompare;

        return (a.description || "").localeCompare(b.description || "");
      });

      let lastType: string | null = null;

      return (
        <Dialog
          open={open}
          fullWidth
          maxWidth="lg"
          onClose={onClose}
          PaperComponent={DraggablePaper}
          hideBackdrop
          disableEnforceFocus
          disableRestoreFocus
          keepMounted={false}
          transitionDuration={0}
          PaperProps={{
            sx: {
              width: "900px",
              maxWidth: "900px",
            },
          }}
        >
          <DialogTitle sx={{ cursor: "move", userSelect: "none" }}>
            Select Validations
          </DialogTitle>

          <DialogContent sx={{ mt: 1 }}>
            {/* Search */}
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <TextField
                sx={{ width: "50%" }}
                size="small"
                label="Search Validations"
                value={searchTerm}
                onChange={handleSearchChange}
              />
              <Box sx={{}}>
                <FormControlLabel
                  sx={{
                    "& .MuiButtonBase-root": {
                      padding: "0 !important",
                      "&.MuiCheckbox-root": {
                        transition: "none",
                      },
                    },
                  }}
                  control={
                    <Checkbox
                      sx={{ p: 0 }}
                      color="secondary"
                      size="small"
                      checked={areAllChecked}
                      indeterminate={areSomeChecked}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  }
                  label="Select All"
                />

                <FormControlLabel
                  sx={{
                    "& .MuiButtonBase-root": {
                      padding: "0 !important",
                      "&.MuiCheckbox-root": {
                        transition: "none",
                      },
                    },
                  }}
                  control={
                    <Checkbox
                      sx={{ p: 0 }}
                      size="small"
                      checked={detailAi}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setDetailAi(checked);
                      }}
                    />
                  }
                  label="Detailed AI"
                />

                <FormControlLabel
                  sx={{
                    "& .MuiButtonBase-root": {
                      padding: "0 !important",
                      "&.MuiCheckbox-root": {
                        transition: "none",
                      },
                    },
                  }}
                  control={
                    <Checkbox
                      sx={{ p: 0 }}
                      size="small"
                      checked={ignorePrevious}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIgnorePrevious(checked);
                      }}
                    />
                  }
                  label="Ignore Previous"
                />
              </Box>
            </Box>

            <Box
              sx={{
                mt: 2,
                borderRadius: 1,
                display: "flex",
              }}
            >
              <FormGroup
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  flexDirection: "column",
                  height: "300px",
                  px: 2,
                  overflow: "auto",

                  "& .MuiButtonBase-root": {
                    padding: "0 !important",
                    "&.MuiCheckbox-root": {
                      transition: "none",
                    },
                  },
                }}
                row
              >
                {sortedOptions.map((item: any) => {
                  const showHeader = item.col_3 !== lastType;
                  lastType = item.col_3;

                  return (
                    <Box key={item.user_code}>
                      {showHeader && (
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 0.5,
                            marginLeft: "-10px",
                            mb: 0.5,
                          }}
                        >
                          <img
                            src={`./themes/${mode}/icons/VAL_TYPE_${item.col_3}.png`}
                            alt="icon"
                            width={20}
                          />
                          <span>{item.col_3}</span>
                        </Typography>
                      )}

                      <FormControlLabel
                        control={
                          <Checkbox
                            sx={{ p: 0 }}
                            size="small"
                            checked={validationChecks[item.user_code] || false}
                            onChange={(e) =>
                              handleCheckboxChange(
                                item.user_code,
                                e.target.checked,
                              )
                            }
                          />
                        }
                        label={item.description}
                      />
                    </Box>
                  );
                })}
              </FormGroup>
            </Box>
          </DialogContent>

          <DialogActions>
            <Button onClick={onClose}>Close</Button>
          </DialogActions>
        </Dialog>
      );
    },
  );

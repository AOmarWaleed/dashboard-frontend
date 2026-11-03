import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  IconButton,
  Stack,
  Divider,
  Chip,
} from "@mui/material";
import { Add, Remove } from "@mui/icons-material";
import { hl7BaseAxios } from "../../../api";
import { isAxiosError } from "axios";
import { toast } from "react-toastify";

// ==================== CONSTANTS ====================
// Define all possible predefined parameters here
export const PREDEFINED_PARAMS = {
  PATIENT_ID: {
    key: "patientId",
    label: "patientId",
    type: "text" as const,
    placeholder: "Enter patient ID",
  },
  EPISODE_NO: {
    key: "episodeNo",
    label: "episodeNo",
    type: "text" as const,
    placeholder: "Enter episode number",
  },
  FACILITY_ID: {
    key: "facilityId",
    label: "facilityId",
    type: "number" as const,
    placeholder: "Enter facility ID",
  },
  ORDER_LINE: {
    key: "orderLine",
    label: "orderLine",
    type: "text" as const,
    placeholder: "Enter order line",
  },
  STATUS: {
    key: "status",
    label: "status",
    type: "text" as const,
    placeholder: "Enter status (e.g., S, A, C)",
  },
} as const;

// Define which params are required
export const REQUIRED_PARAMS = {
  // PATIENT_ID: false,
  // EPISODE_NO: false,
  // FACILITY_ID: false,
  // ORDER_LINE: false,
} as const;

// Define the mapping from transaction data keys to param keys
export const TRANSACTION_DATA_MAPPING = {
  patient_id: "patientId",
  episode_no: "episodeNo",
  // Add more mappings as needed
} as const;

// ==================== TYPES ====================
type PredefinedParamKey = keyof typeof PREDEFINED_PARAMS;
type PredefinedParam = typeof PREDEFINED_PARAMS[PredefinedParamKey] & {
  value?: string | number;
};

interface ParamItem {
  key: string;
  value: string;
}

interface ResendDialogProps {
  open: boolean;
  onClose: () => void;
  url: string;
  onResend?: (updatedUrl: string) => void;
  title?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  transactionData?: {
    patient_id?: string | number;
    episode_no?: string | number;
    [key: string]: any;
  };
  // Optional: allow overriding predefined params
  customPredefinedParams?: PredefinedParam[];
  // Optional: custom required params config
  customRequiredParams?: Record<string, boolean>;
}

// ==================== COMPONENT ====================
export default function ResendDialog({
  open,
  onClose,
  url,
  onResend,
  title = "Resend Request",
  onSuccess,
  onError,
  transactionData,
  customPredefinedParams = [],
  customRequiredParams = {},
}: ResendDialogProps) {
  const [params, setParams] = useState<ParamItem[]>([]);
  const [baseUrl, setBaseUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [newParamKey, setNewParamKey] = useState("");
  const [newParamValue, setNewParamValue] = useState("");

  // Get predefined params based on transaction data and constants
  const getDefaultPredefinedParams = (): PredefinedParam[] => {
    const defaultParams: PredefinedParam[] = [];

    // Map transaction data to predefined params
    if (transactionData?.patient_id) {
      defaultParams.push({
        ...PREDEFINED_PARAMS.PATIENT_ID,
        value: String(transactionData.patient_id),
      });
    }

    if (transactionData?.episode_no) {
      defaultParams.push({
        ...PREDEFINED_PARAMS.EPISODE_NO,
        value: String(transactionData.episode_no),
      });
    }

    // Check for other common fields in transaction data
    if (transactionData?.facilityId) {
      defaultParams.push({
        ...PREDEFINED_PARAMS.FACILITY_ID,
        value: String(transactionData.facilityId),
      });
    }

    if (transactionData?.orderLine) {
      defaultParams.push({
        ...PREDEFINED_PARAMS.ORDER_LINE,
        value: String(transactionData.orderLine),
      });
    }

    // Add any custom predefined params
    customPredefinedParams.forEach((param) => {
      // Don't duplicate existing params
      const existingKey = defaultParams.some((p) => p.key === param.key);
      if (!existingKey) {
        defaultParams.push(param);
      }
    });

    return defaultParams;
  };

  // Check if a param is required
  const isParamRequired = (key: string): boolean => {
    // Check custom required params first
    if (customRequiredParams[key] !== undefined) {
      return customRequiredParams[key];
    }

    // Check predefined required params
    const requiredMap: Record<string, boolean> = { ...REQUIRED_PARAMS };
    return requiredMap[key] || false;
  };

  // Get param type
  const getParamType = (key: string): "text" | "number" => {
    const predefined = getDefaultPredefinedParams();
    const param = predefined.find((p) => p.key === key);
    return param?.type || "text";
  };

  // Get param placeholder
  const getParamPlaceholder = (key: string): string => {
    const predefined = getDefaultPredefinedParams();
    const param = predefined.find((p) => p.key === key);
    return param?.placeholder || `Enter ${key}`;
  };

  useEffect(() => {
    if (url) {
      try {
        const urlObj = new URL(url, window.location.origin);
        setBaseUrl(urlObj.pathname);
        const queryParams: ParamItem[] = [];
        urlObj.searchParams.forEach((value, key) => {
          queryParams.push({ key, value });
        });

        // Initialize predefined params with their values
        const defaultPredefined = getDefaultPredefinedParams();
        const predefinedItems: ParamItem[] = [];
        defaultPredefined.forEach((param) => {
          if (param.value !== undefined && param.value !== null) {
            predefinedItems.push({
              key: param.key,
              value: String(param.value),
            });
          }
        });

        // Merge query params with predefined values (predefined take precedence)
        // First, add all query params
        const mergedParams: ParamItem[] = [...queryParams];
        
        // Then add/override with predefined params
        predefinedItems.forEach((predefinedItem) => {
          const existingIndex = mergedParams.findIndex(
            (p) => p.key === predefinedItem.key
          );
          if (existingIndex !== -1) {
            // Update existing param
            mergedParams[existingIndex] = predefinedItem;
          } else {
            // Add new param
            mergedParams.push(predefinedItem);
          }
        });

        setParams(mergedParams);
      } catch (error) {
        console.error("Error parsing URL:", error);
      }
    }
  }, [url, transactionData]);

  const handleParamValueChange = (index: number, value: string) => {
    setParams((prev) => {
      const newParams = [...prev];
      newParams[index] = { ...newParams[index], value };
      return newParams;
    });
  };

  const handleParamKeyChange = (index: number, newKey: string) => {
    if (!newKey.trim()) {
      // If empty, just update with empty string (validation will handle)
      setParams((prev) => {
        const newParams = [...prev];
        newParams[index] = { ...newParams[index], key: newKey };
        return newParams;
      });
      return;
    }

    const oldKey = params[index].key;
    
    // Check if new key already exists (and it's not the same key)
    if (newKey.trim() !== oldKey) {
      const existingIndex = params.findIndex((p) => p.key === newKey.trim());
      if (existingIndex !== -1) {
        toast.warning(`Parameter "${newKey.trim()}" already exists`);
        return;
      }
    }

    // Update the param key
    setParams((prev) => {
      const newParams = [...prev];
      newParams[index] = { ...newParams[index], key: newKey.trim() };
      return newParams;
    });
  };

  const handleRemoveParam = (index: number) => {
    const key = params[index].key;
    
    // Check if it's a predefined param that's required
    if (isParamRequired(key)) {
      toast.warning(`"${key}" is required and cannot be removed`);
      return;
    }

    setParams((prev) => {
      const newParams = [...prev];
      newParams.splice(index, 1);
      return newParams;
    });
  };

  const handleAddParam = () => {
    if (newParamKey.trim() && newParamValue.trim()) {
      // Check if key already exists
      if (params.some((p) => p.key === newParamKey.trim())) {
        toast.warning(`Parameter "${newParamKey.trim()}" already exists`);
        return;
      }

      setParams((prev) => [
        ...prev,
        { key: newParamKey.trim(), value: newParamValue.trim() },
      ]);
      setNewParamKey("");
      setNewParamValue("");
    } else {
      toast.warning("Please enter both key and value");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddParam();
    }
  };

  const renderParamField = (param: ParamItem, index: number) => {
    const isRequired = isParamRequired(param.key);
    const type = getParamType(param.key);
    const placeholder = getParamPlaceholder(param.key);

    if (type === "number") {
      return (
        <TextField
          label="Value"
          value={param.value}
          onChange={(e) => handleParamValueChange(index, e.target.value)}
          fullWidth
          size="small"
          variant="outlined"
          disabled={loading}
          type="number"
          required={isRequired}
          placeholder={placeholder}
          sx={{ flex: 2 }}
        />
      );
    }

    return (
      <TextField
        label="Value"
        value={param.value}
        onChange={(e) => handleParamValueChange(index, e.target.value)}
        fullWidth
        size="small"
        variant="outlined"
        disabled={loading}
        required={isRequired}
        placeholder={placeholder}
        sx={{ flex: 2 }}
      />
    );
  };

  const handleSubmit = async () => {
    const searchParams = new URLSearchParams();
    params.forEach((param) => {
      if (param.value) {
        searchParams.append(param.key, param.value);
      }
    });
    const updatedUrl = `${baseUrl}?${searchParams.toString()}`;

    if (onResend) {
      onResend(updatedUrl);
      onClose();
      return;
    }

    try {
      setLoading(true);
      const { data } = await hl7BaseAxios.get(updatedUrl);
      const responseData = data?.data;

      if (!responseData) {
        toast.error("No data received from API");
        throw new Error("No data received from API");
      }

      if (onSuccess) {
        onSuccess(responseData);
      }

      toast.success("Request resent successfully");
      onClose();
    } catch (error) {
      if (isAxiosError(error)) {
        console.error("Error resending request:", error.response?.data?.msg);
        const description =
          error.response?.data?.description || "Error resending request";
        toast.error(description);

        if (onError) {
          onError(error);
        }
      } else {
        console.error("Error resending request:", error);
        toast.error("Error resending request");
      }
    } finally {
      setLoading(false);
    }
  };

  const defaultPredefined = getDefaultPredefinedParams();
  const requiredParamsCount = defaultPredefined.filter((p) =>
    isParamRequired(p.key)
  ).length;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}
        >
          {title}
          {requiredParamsCount > 0 && (
            <Chip
              label={`${requiredParamsCount} required param${
                requiredParamsCount > 1 ? "s" : ""
              }`}
              size="small"
              color="info"
              variant="outlined"
            />
          )}
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Edit existing parameters or add new ones below:
            {requiredParamsCount > 0 && (
              <span style={{ display: "block", marginTop: 4 }}>
                <Chip
                  label="Required"
                  size="small"
                  color="error"
                  variant="outlined"
                  sx={{ mr: 1 }}
                />
                indicates parameters that are required
              </span>
            )}
          </Typography>

          {/* Existing Parameters */}
          {params.length > 0 && (
            <>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {params.map((param, index) => {
                  const isRequired = isParamRequired(param.key);

                  return (
                    <Box
                      key={index} // Use index as stable key instead of param.key
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        borderRadius: 1,
                        transition: "all 0.2s ease",
                      }}
                    >
                      {/* Key Field - Now editable */}
                      <TextField
                        label="Parameter Name"
                        value={param.key}
                        onChange={(e) => handleParamKeyChange(index, e.target.value)}
                        size="small"
                        variant="outlined"
                        disabled={loading || isRequired}
                        sx={{
                          flex: 1,
                        }}
                        required={isRequired}
                        placeholder="Enter parameter name"
                      />

                      {/* Value Field */}
                      {renderParamField(param, index)}

                      {/* Remove Button */}
                      <IconButton
                        onClick={() => handleRemoveParam(index)}
                        disabled={loading || isRequired}
                        color="error"
                        size="small"
                        title={
                          isRequired
                            ? "Required parameter cannot be removed"
                            : "Remove parameter"
                        }
                        sx={{
                          "&:hover": {
                            backgroundColor: (theme) =>
                              theme.palette.error.light,
                            color: (theme) => theme.palette.error.dark,
                          },
                        }}
                      >
                        <Remove />
                      </IconButton>
                    </Box>
                  );
                })}
              </Box>
              <Divider sx={{ my: 1 }} />
            </>
          )}

          {/* Add New Parameter */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Add New Parameter
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                label="Key"
                value={newParamKey}
                onChange={(e) => setNewParamKey(e.target.value)}
                onKeyPress={handleKeyPress}
                size="small"
                variant="outlined"
                disabled={loading}
                sx={{ flex: 1 }}
                placeholder="e.g., facilityId"
              />
              <TextField
                label="Value"
                value={newParamValue}
                onChange={(e) => setNewParamValue(e.target.value)}
                onKeyPress={handleKeyPress}
                size="small"
                variant="outlined"
                disabled={loading}
                sx={{ flex: 2 }}
                placeholder="e.g., 1"
              />
              <IconButton
                onClick={handleAddParam}
                disabled={
                  loading ||
                  !newParamKey.trim() ||
                  !newParamValue.trim()
                }
                color="primary"
              >
                <Add />
              </IconButton>
            </Stack>
          </Box>

          {/* Preview URL */}
          {params.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Preview URL:
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  p: 1,
                  borderRadius: 1,
                  wordBreak: "break-all",
                  fontSize: "0.75rem",
                  fontFamily: "monospace",
                  backgroundColor: (theme) => theme.palette.grey[100],
                }}
              >
                {baseUrl}?
                {params
                  .filter((param) => param.value)
                  .map((param) => `${param.key}=${param.value}`)
                  .join("&")}
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading}
        >
          {loading ? "Resending..." : "Resend"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
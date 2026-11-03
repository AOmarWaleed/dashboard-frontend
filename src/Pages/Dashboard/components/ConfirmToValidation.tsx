import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
  Chip,
  Tooltip,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import { ValidationWithOptionsDialog } from './ValidationWithOptionsDialog';

interface SelectedData {
  payer?: { payer_id: string } | null;
  diagnosis?: { diagnosis_code: string } | null;
  service?: { item_code: string } | null;
}

interface ConfirmToValidationProps {
  open: boolean;
  onClose: () => void;
  selectedData?: SelectedData;
  validationOptions?: any[];
  validationChecks?: Record<string, boolean>;
  onValidationChecksChange?: (checks: Record<string, boolean>) => void;
  onStartValidation?: (selectedValidations: any[]) => void;
}

export const ConfirmToValidation: React.FC<ConfirmToValidationProps> = ({
  open,
  onClose,
  selectedData = {},
  validationOptions = [],
  validationChecks = {},
  onValidationChecksChange,
  onStartValidation,
}) => {
  const [openValidationDialog, setOpenValidationDialog] = useState(false);
  const [isValidationStarted, setIsValidationStarted] = useState(false);

  const hasSelectedData = 
    selectedData?.diagnosis?.diagnosis_code || 
    selectedData?.service?.item_code;

  const selectedValidations = Object.entries(validationChecks)
    .filter(([, checked]) => checked)
    .map(([userCode]) =>
      validationOptions.find((v) => v.user_code === userCode)
    )
    .filter(Boolean);

  const hasSelectedValidations = selectedValidations.length > 0;

  const handleStartValidation = () => {
    if (onStartValidation && hasSelectedValidations) {
      setIsValidationStarted(true);
      onStartValidation(selectedValidations);
      onClose();
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircleOutlineIcon color="primary" />
          Selected Data for Validation
        </DialogTitle>

        <DialogContent>
          {!hasSelectedData ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <InfoOutlinedIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No Data Selected
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please select payer, diagnosis, or service from the filters above.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              

              {/* Diagnosis Section */}
              {selectedData?.diagnosis?.diagnosis_code && (
                <Box>
                  <Typography variant="subtitle2" color="secondary" gutterBottom>
                    Diagnosis
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={selectedData.diagnosis.diagnosis_code}
                      color="secondary"
                      variant="outlined"
                      size="small"
                    />
                    <Typography variant="body2">
                      {selectedData.diagnosis.diagnosis_code}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Service Section */}
              {selectedData?.service?.item_code && (
                <Box>
                  <Typography variant="subtitle2" color="success" gutterBottom>
                    Service
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={selectedData.service.item_code}
                      color="success"
                      variant="outlined"
                      size="small"
                    />
                    <Typography variant="body2">
                      {selectedData.service.item_code}
                    </Typography>
                  </Box>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Validation Status */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Validation Configuration
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setOpenValidationDialog(true)}
                    startIcon={<CheckCircleOutlineIcon />}
                  >
                    {hasSelectedValidations 
                      ? `${selectedValidations.length} Validation(s) Selected`
                      : 'Select Validations'
                    }
                  </Button>
                  
                  {hasSelectedValidations ? (
                    <Chip
                      label={`${selectedValidations.length} selected`}
                      color="success"
                      size="small"
                    />
                  ) : (
                    <Tooltip title="Please select at least one validation">
                      <InfoOutlinedIcon color="warning" fontSize="small" />
                    </Tooltip>
                  )}
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleStartValidation}
            disabled={!hasSelectedData || !hasSelectedValidations || isValidationStarted}
            startIcon={<PlayCircleOutlineIcon />}
          >
            {isValidationStarted ? 'Validation Running...' : 'Start Validation'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Validation Options Dialog */}
      {onValidationChecksChange && (
        <ValidationWithOptionsDialog
          open={openValidationDialog}
          onClose={() => setOpenValidationDialog(false)}
          validationOptions={validationOptions}
          validationChecks={validationChecks}
          onValidationChecksChange={onValidationChecksChange}
        />
      )}
    </>
  );
};
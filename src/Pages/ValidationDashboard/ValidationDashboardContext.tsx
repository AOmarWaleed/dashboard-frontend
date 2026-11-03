import dayjs from "dayjs";
import React, { createContext, useState } from "react";
import {
  API_DATE_TIME_MINUTES_FORMAT,
  formatDateTime,
} from "../../utils/dateFormat";

export interface ValidationClaimParams {
  start_date?: string;
  end_date?: string;
  api_trans_id?: string;
  validation_code?: string;
  payer_id?: string;
  patient_id?: string;
  item_id?: string;
  diagnosis_code?: string;
  req_id?: string;
  status?: string;
  req_type?: string;
  physician_emp_id?: string;
}

interface ValidationDashboardContextType {
  getAllValidationClaimParams: ValidationClaimParams;
  setAllValidationClaimParams: React.Dispatch<
    React.SetStateAction<ValidationClaimParams>
  >;
  getAllFormValues: ValidationClaimParams;
  setAllFormValues: React.Dispatch<React.SetStateAction<ValidationClaimParams>>;
}

export const ValidationDashboardContext =
  createContext<ValidationDashboardContextType | null>(null);

export const ValidationDashboardProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [getAllValidationClaimParams, setAllValidationClaimParams] =
    useState<ValidationClaimParams>({
      start_date: formatDateTime(
        dayjs().startOf("day"),
        API_DATE_TIME_MINUTES_FORMAT,
      ),
    });
  const [getAllFormValues, setAllFormValues] = useState<ValidationClaimParams>({
    start_date: formatDateTime(
      dayjs().startOf("day"),
      API_DATE_TIME_MINUTES_FORMAT,
    ),
  });
  return (
    <ValidationDashboardContext.Provider
      value={{
        getAllValidationClaimParams,
        setAllValidationClaimParams,
        getAllFormValues,
        setAllFormValues,
      }}
    >
      {children}
    </ValidationDashboardContext.Provider>
  );
};

export const useValidationDashboard = () => {
  const context = React.useContext(ValidationDashboardContext);
  if (!context) {
    throw new Error(
      "useValidationDashboard must be used within a ValidationDashboardProvider",
    );
  }
  return context;
};

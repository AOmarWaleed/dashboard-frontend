import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { Filters } from "../Components/FilterForm";

export interface Payers {
  payer_id: number;
  payer_name: string;
  cnt: number;
  response_ms: number;
}

export interface TransSummary {
  api_name: string;
  api_function: string;
  status: string;
  earliest_trans: string;
  latest_trans: string;
}

export interface TransDetails {
  api_trans_id: number;
  cancel_api_trans_id: string;
  api_name: string;
  api_function: string;
  episode_no: string;
  outcome: string;
  api_provider: string;
  creation_date: string;
  error_message: string;
  response_time_ms: number;
  local_api_time_ms: number;
  patient_id: string | number;
  payer_id: string | number;
  status: string;
  http_status_code: number;
  response: string;
  request: string;
  bundle_id: string | number;
  url: string;
  dest_url: string;
  transaction_id: string;
}

export interface TransError {
  message_id: string;
  api_trans_id: string;
  nphies_message_id: string;
  nphies_message: string;
  error_element: string;
  element_value: string;
  item_no: string;
}

export interface TransResponse {
  response_seq: number;
  response_type: string;
  status: string;
  error_message: string;
  response_bundle: string;
}

export interface PollDetails {
  response_seq: number;
  response_id: number;
  response_type: string;
  status: string;
  error_message: string;
  response_bundle: string;
}

interface SelectionState {
  payerId?: string | number | null;
  transSummaryId?: string | number | null;
  transDetailsId?: string | number | null;
  transErrorId?: string | number | null;
}

interface TransMonitorContextValue {
  transMonitorContextData: {
    selectionObj: SelectionState;
  };
  updateSelectedPayerFn: (value: string | number | null) => void;
  updateSelectedTransSummaryFn: (value: string | number | null) => void;
  updateSelectedTransDetailsFn: (value: string | number | null) => void;
  updateSelectedTransErrorFn: (value: string | number | null) => void;
  getPayersParams: (filters: Filters | null) => any;
  getTransSummaryParams: (selectedPayerId: any, filters: Filters | null) => any;
}

const TransMonitorContext = createContext<TransMonitorContextValue | null>(
  null,
);

export function useTransMonitorContext() {
  const ctx = useContext(TransMonitorContext);
  if (!ctx) {
    throw new Error(
      "useTransMonitorContext must be used within TransMonitorProvider",
    );
  }
  return ctx;
}

export function TransMonitorProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectionObj, setSelectionObj] = useState<SelectionState>({});

  const updateSelectedPayerFn = useCallback((value: string | number | null) => {
    setSelectionObj((prev) => ({ ...prev, payerId: value }));
  }, []);

  const updateSelectedTransSummaryFn = useCallback(
    (value: string | number | null) => {
      setSelectionObj((prev) => ({ ...prev, transSummaryId: value }));
    },
    [],
  );

  const updateSelectedTransDetailsFn = useCallback(
    (value: string | number | null) => {
      setSelectionObj((prev) => ({ ...prev, transDetailsId: value }));
    },
    [],
  );

  const updateSelectedTransErrorFn = useCallback(
    (value: string | number | null) => {
      setSelectionObj((prev) => ({ ...prev, transErrorId: value }));
    },
    [],
  );

  const getPayersParams = useCallback((filters: Filters | null) => {
    const params = { ...(filters ?? ({} as Filters)) };
    delete params.payers;
    delete params.status;
    return params;
  }, []);

  const getTransSummaryParams = useCallback(
    (selectedPayerId: any, filters: Filters | null) => {
      const filterParams = { ...(filters ?? {}) };

      delete filterParams.status;
      delete filterParams.payers;

      const finalPayerId = filters?.payers ? selectedPayerId : filters?.payer_id;

      const params: any = {
        ...filterParams,
      };

      if (finalPayerId && finalPayerId !== -1) {
        params.payer_id = finalPayerId;
      } else {
        delete params.payer_id;
      }

      return params;
    },
    [],
  );

  const value = useMemo(
    () => ({
      transMonitorContextData: { selectionObj },
      updateSelectedPayerFn,
      updateSelectedTransSummaryFn,
      updateSelectedTransDetailsFn,
      updateSelectedTransErrorFn,
      getPayersParams,
      getTransSummaryParams,
    }),
    [
      selectionObj,
      updateSelectedPayerFn,
      updateSelectedTransSummaryFn,
      updateSelectedTransDetailsFn,
      updateSelectedTransErrorFn,
    ],
  );

  return (
    <TransMonitorContext.Provider value={value}>
      {children}
    </TransMonitorContext.Provider>
  );
}
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

export interface SelectionState {
  payerId: string | number | null;
  transSummary: TransSummary | null;
  transSummaryId: string | number | null;
  transDetailsId: string | number | null;
  transDetail: TransDetails | null;
  transErrorId: string | number | null;
}

interface TransMonitorContextValue {
  transMonitorContextData: {
    selectionObj: SelectionState;
  };
  updateSelectedPayerFn: (value: string | number | null) => void;
  updateSelectedTransSummaryFn: (summary: TransSummary | null) => void;
  updateSelectedTransDetailsFn: (detail: TransDetails | null) => void;
  updateSelectedTransErrorFn: (value: string | number | null) => void;
  resetAllSelectionsFn: () => void;
  getPayersParams: (filters: Filters | null) => any;
  getTransSummaryParams: (selectedPayerId: any, filters: Filters | null) => any;
  getTransDetailsParams: (
    selectedPayerId: any,
    selectedSummary: TransSummary | null,
    filters: Filters | null,
  ) => any;
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
  const [selectionObj, setSelectionObj] = useState<SelectionState>({
    payerId: null,
    transSummary: null,
    transSummaryId: null,
    transDetailsId: null,
    transDetail: null,
    transErrorId: null,
  });

  const updateSelectedPayerFn = useCallback((value: string | number | null) => {
    setSelectionObj((prev) => {
      if (prev.payerId === value) return prev;
      return {
        payerId: value,
        transSummary: null,
        transSummaryId: null,
        transDetailsId: null,
        transDetail: null,
        transErrorId: null,
      };
    });
  }, []);

  const updateSelectedTransSummaryFn = useCallback(
    (summary: TransSummary | null) => {
      const summaryId = summary
        ? `${summary.api_function}-${summary.api_name}-${summary.status}`
        : null;
      setSelectionObj((prev) => {
        if (prev.transSummaryId === summaryId) return prev;
        return {
          ...prev,
          transSummary: summary,
          transSummaryId: summaryId,
          transDetailsId: null,
          transDetail: null,
          transErrorId: null,
        };
      });
    },
    [],
  );

  const updateSelectedTransDetailsFn = useCallback(
    (detail: TransDetails | null) => {
      const detailId = detail?.api_trans_id ?? null;
      setSelectionObj((prev) => {
        if (prev.transDetailsId === detailId) return prev;
        return {
          ...prev,
          transDetail: detail,
          transDetailsId: detailId,
          transErrorId: null,
        };
      });
    },
    [],
  );

  const updateSelectedTransErrorFn = useCallback(
    (value: string | number | null) => {
      setSelectionObj((prev) => ({ ...prev, transErrorId: value }));
    },
    [],
  );

  const resetAllSelectionsFn = useCallback(() => {
    setSelectionObj({
      payerId: null,
      transSummary: null,
      transSummaryId: null,
      transDetailsId: null,
      transDetail: null,
      transErrorId: null,
    });
  }, []);

  const getPayersParams = useCallback((filters: Filters | null) => {
    const params = { ...(filters ?? ({} as Filters)) };
    delete params.payers;
    delete params.status;
    return params;
  }, []);

  const getTransSummaryParams = useCallback(
    (selectedPayerId: any, filters: Filters | null) => {
      const filterParams = { ...(filters ?? ({} as Filters)) };

      delete filterParams.status;
      delete filterParams.payers;

      const groupByPayers = filters?.payers !== false;
      const finalPayerId = groupByPayers ? selectedPayerId : filters?.payer_id;

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

  const getTransDetailsParams = useCallback(
    (
      selectedPayerId: any,
      selectedSummary: TransSummary | null,
      filters: Filters | null,
    ) => {
      const activeFilters = { ...(filters ?? ({} as Filters)) };
      const groupByPayers = activeFilters.payers !== false;
      const groupByStatus = activeFilters.status !== false;

      const finalPayerId = groupByPayers
        ? selectedPayerId
        : activeFilters.payer_id;

      const params: any = {
        ...activeFilters,
      };

      if (finalPayerId && finalPayerId !== -1) {
        params.payer_id = finalPayerId;
      } else {
        delete params.payer_id;
      }

      if (groupByStatus && selectedSummary) {
        if (selectedSummary.api_name) params.api_name = selectedSummary.api_name;
        if (selectedSummary.api_function)
          params.api_function = selectedSummary.api_function;
        if (selectedSummary.status) params.status = selectedSummary.status;
      }

      delete params.payers;
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
      resetAllSelectionsFn,
      getPayersParams,
      getTransSummaryParams,
      getTransDetailsParams,
    }),
    [
      selectionObj,
      updateSelectedPayerFn,
      updateSelectedTransSummaryFn,
      updateSelectedTransDetailsFn,
      updateSelectedTransErrorFn,
      resetAllSelectionsFn,
      getPayersParams,
      getTransSummaryParams,
      getTransDetailsParams,
    ],
  );

  return (
    <TransMonitorContext.Provider value={value}>
      {children}
    </TransMonitorContext.Provider>
  );
}

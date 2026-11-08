import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { dashboardAxios } from "../../../api";
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

interface LoadingState {
  getPayersReq: boolean;
  getTransSummriesReq: boolean;
  getTransDetailsReq: boolean;
  getTransErrorsReq: boolean;
  getTransResponsesReq: boolean;
  getPollDetailsReq: boolean;
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
    isLoading: LoadingState;
  };
  updateSelectedPayerFn: (value: string | number | null) => void;
  updateSelectedTransSummaryFn: (value: string | number | null) => void;
  updateSelectedTransDetailsFn: (value: string | number | null) => void;
  updateSelectedTransErrorFn: (value: string | number | null) => void;
  getPayersFn: (data: any) => Promise<any>;
  getPayersParams: (filters: Filters | null) => any;
  getTransSummaryParams: (selectedPayerId: any, filters: Filters | null) => any;
  getTransSummaryFn: (data: any) => Promise<any>;
  getTransDetailsFn: (data: any) => Promise<any>;
  getTransErrorsFn: (data: any) => Promise<any>;
  getTransResponsesFn: (data: any) => Promise<any>;
  getPollDetailsFn: (data: any) => Promise<any>;
}

const TransMonitorContext = createContext<TransMonitorContextValue | null>(
  null,
);

// eslint-disable-next-line react-refresh/only-export-components
export function useTransMonitorContext() {
  const ctx = useContext(TransMonitorContext);
  if (!ctx) {
    throw new Error(
      "useTransMonitorContext must be used within TransMonitorProvider",
    );
  }
  return ctx;
}

export const cleanParams = (obj: Record<string, any>) => {
  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (
      val !== undefined &&
      val !== null &&
      val !== "" &&
      val !== "null" &&
      val !== "undefined"
    ) {
      cleaned[key] = val;
    }
  }
  return cleaned;
};

export function TransMonitorProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectionObj, setSelectionObj] = useState<SelectionState>({});
  const [isLoading, setIsLoading] = useState<LoadingState>({
    getPayersReq: false,
    getTransSummriesReq: false,
    getTransDetailsReq: false,
    getTransErrorsReq: false,
    getTransResponsesReq: false,
    getPollDetailsReq: false,
  });

  const abortControllersRef = useRef({
    payers: null as AbortController | null,
    summaries: null as AbortController | null,
    details: null as AbortController | null,
    errors: null as AbortController | null,
    responses: null as AbortController | null,
    pollDetails: null as AbortController | null,
  });

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

  const getPayersParams = (filters: Filters | null) => {
    const params = { ...(filters ?? ({} as Filters)) };
    delete params.status;
    delete params.payers;
    return cleanParams(params);
  };

  const getPayersFn = useCallback(async (params: any) => {
    const { limit = 5, page = 1, filters } = params;
    const filterData = getPayersParams(filters);

    abortControllersRef.current.payers?.abort();
    const controller = new AbortController();
    abortControllersRef.current.payers = controller;

    setIsLoading((prev) => ({ ...prev, getPayersReq: true }));
    try {
      const { data } = await dashboardAxios.get("/transMonitor/payers", {
        params: { limit, page, ...filterData },
        signal: controller.signal,
      });
      return data;
    } finally {
      setIsLoading((prev) => ({ ...prev, getPayersReq: false }));
    }
  }, []);

  const getTransSummaryParams = (
    selectedPayerId: any,
    filters: Filters | null,
  ) => {
    const filterParams = { ...(filters ?? ({} as Filters)) };
    delete filterParams.status;
    delete filterParams.payers;
    const payer_id = filters?.payers ? selectedPayerId : filters?.payer_id;
    return cleanParams({
      ...filterParams,
      payer_id,
    });
  };

  const getTransSummaryFn = useCallback(async (params: any) => {
    const { limit = 5, page = 1 } = params;
    const filterData = {
      ...params.filters,
      payer_id: params.filters.payers
        ? params.payer_id
        : params.filters.payer_id,
    } as Filters & { status?: any; payers?: any; payer_id?: any };

    delete filterData.status;
    delete filterData.payers;

    abortControllersRef.current.summaries?.abort();
    const controller = new AbortController();
    abortControllersRef.current.summaries = controller;

    setIsLoading((prev) => ({ ...prev, getTransSummriesReq: true }));
    try {
      const { data } = await dashboardAxios.get("/transMonitor/trans_summaries", {
        params: { limit, page, ...filterData },
        signal: controller.signal,
      });
      return data;
    } finally {
      setIsLoading((prev) => ({ ...prev, getTransSummriesReq: false }));
    }
  }, []);

  const getTransDetailsFn = useCallback(async (data: any) => {
    const { limit = 5, page = 1 } = data;

    const filterData = {
      ...data.filters,
      payer_id: data.filters.payers ? data.payer_id : data.filters.payer_id,
      api_name: data.filters.status ? data.api_name : data.filters.api_name,
      api_function: data.filters.status
        ? data.api_function
        : data.filters.api_function,
      status: data.filters.status ? data.status : "",
    } as Filters & { payers?: any; status?: any };

    delete filterData.payers;

    abortControllersRef.current.details?.abort();
    const controller = new AbortController();
    abortControllersRef.current.details = controller;

    setIsLoading((prev) => ({ ...prev, getTransDetailsReq: true }));
    try {
      const { data: response } = await dashboardAxios.get(
        "/transMonitor/trans_details",
        {
          params: { limit, page, ...filterData },
          signal: controller.signal,
        },
      );
      return response;
    } finally {
      setIsLoading((prev) => ({ ...prev, getTransDetailsReq: false }));
    }
  }, []);

  const getTransErrorsFn = useCallback(async (params: any) => {
    const { trans_id, page, limit } = params;
    abortControllersRef.current.errors?.abort();
    const controller = new AbortController();
    abortControllersRef.current.errors = controller;

    setIsLoading((prev) => ({ ...prev, getTransErrorsReq: true }));
    try {
      const { data } = await dashboardAxios.get("/transMonitor/trans_errors", {
        params: { trans_id, page, limit },
        signal: controller.signal,
      });
      return data;
    } finally {
      setIsLoading((prev) => ({ ...prev, getTransErrorsReq: false }));
    }
  }, []);

  const getTransResponsesFn = useCallback(async (params: any) => {
    const { trans_id, page, limit } = params;
    abortControllersRef.current.responses?.abort();
    const controller = new AbortController();
    abortControllersRef.current.responses = controller;

    setIsLoading((prev) => ({ ...prev, getTransResponsesReq: true }));
    try {
      const { data } = await dashboardAxios.get("/transMonitor/trans_responses", {
        params: { trans_id, page, limit },
        signal: controller.signal,
      });
      return data;
    } finally {
      setIsLoading((prev) => ({ ...prev, getTransResponsesReq: false }));
    }
  }, []);

  const getPollDetailsFn = useCallback(async (params: any) => {
    const { trans_id, page, limit } = params;
    abortControllersRef.current.pollDetails?.abort();
    const controller = new AbortController();
    abortControllersRef.current.pollDetails = controller;

    setIsLoading((prev) => ({ ...prev, getPollDetailsReq: true }));
    try {
      const { data } = await dashboardAxios.get("/transMonitor/poll_details", {
        params: { trans_id, page, limit },
        signal: controller.signal,
      });
      return data;
    } finally {
      setIsLoading((prev) => ({ ...prev, getPollDetailsReq: false }));
    }
  }, []);

  const value = useMemo(
    () => ({
      transMonitorContextData: { selectionObj, isLoading },
      updateSelectedPayerFn,
      updateSelectedTransSummaryFn,
      updateSelectedTransDetailsFn,
      updateSelectedTransErrorFn,
      getPayersFn,
      getPayersParams,
      getTransSummaryParams,
      getTransSummaryFn,
      getTransDetailsFn,
      getTransErrorsFn,
      getTransResponsesFn,
      getPollDetailsFn,
    }),
    [
      selectionObj,
      isLoading,
      updateSelectedPayerFn,
      updateSelectedTransSummaryFn,
      updateSelectedTransDetailsFn,
      updateSelectedTransErrorFn,
      getPayersFn,
      getPayersParams,
      getTransSummaryParams,
      getTransSummaryFn,
      getTransDetailsFn,
      getTransErrorsFn,
      getTransResponsesFn,
      getPollDetailsFn,
    ],
  );

  return (
    <TransMonitorContext.Provider value={value}>
      {children}
    </TransMonitorContext.Provider>
  );
}

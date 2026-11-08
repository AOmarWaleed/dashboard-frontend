import { useEffect, useState } from "react";
import { dashboardAxios } from "../api";

export interface ApiTransactionOption {
  value: string;
  label: string;
}

export interface ApiTransactionOptionsInput {
  payer_id?: number | string | null;
  api_provider?: string | null;
  api_name?: string | null;
  api_function?: string | null;
  status?: string | null;
  date_start?: string | null;
  date_end?: string | null;
  all_facilities?: boolean;
  facility_id?: string | number | null;
}

export interface ApiTransactionOptionsResult {
  payers: ApiTransactionOption[];
  providers: ApiTransactionOption[];
  apiNames: ApiTransactionOption[];
  apiFunctions: ApiTransactionOption[];
  statuses: ApiTransactionOption[];
}

const EMPTY: ApiTransactionOptionsResult = {
  payers: [],
  providers: [],
  apiNames: [],
  apiFunctions: [],
  statuses: [],
};

export function useApiTransactionOptions(input: ApiTransactionOptionsInput) {
  const {
    payer_id,
    api_provider,
    api_name,
    api_function,
    status,
    date_start,
    date_end,
    all_facilities,
    facility_id,
  } = input;

  const [options, setOptions] = useState<ApiTransactionOptionsResult>(EMPTY);

  useEffect(() => {
    let active = true;

    dashboardAxios
      .get("/transactionTimeline/filter-options", {
        params: {
          ...(date_start ? { date_start } : {}),
          ...(date_end ? { date_end } : {}),
          ...(payer_id ? { payer_id } : {}),
          ...(api_provider ? { api_provider } : {}),
          ...(api_name ? { api_name } : {}),
          ...(api_function ? { api_function } : {}),
          ...(status ? { status } : {}),
          ...(all_facilities ? { all_facilities: true } : (facility_id ? { facility_id } : {})),
        },
      })
      .then((r) => {
        if (!active) return;
        setOptions({ ...EMPTY, ...r.data?.data });
      })
      .catch(() => {
        if (active) setOptions(EMPTY);
      });

    return () => {
      active = false;
    };
  }, [
    payer_id,
    api_provider,
    api_name,
    api_function,
    status,
    date_start,
    date_end,
    all_facilities,
    facility_id,
  ]);

  return options;
}

export default useApiTransactionOptions;

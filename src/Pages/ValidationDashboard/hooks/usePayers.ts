import { useCallback, useState } from "react";
import { dashboardAxios } from "../../../api";

export interface PayerOption {
  payer_id?: string;
  description?: string;
  payer_pk?: string | number;
  [key: string]: unknown;
}

/**
 * Local payer lookup hook.
 *
 * Replaces the nphies-redux `usePayerSlice` for the validation dashboard
 * filter form; data is read from the dashboard API.
 */
export function usePayers() {
  const [options, setOptions] = useState<PayerOption[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPayers = useCallback(async (search: string) => {
    try {
      setLoading(true);
      const { data } = await dashboardAxios.get("/payers/v2", {
        params: { search },
      });
      setOptions(data?.data ?? []);
    } catch (error) {
      console.error("Failed to fetch payers:", error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { options, loading, fetchPayers };
}

export default usePayers;

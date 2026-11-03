import axios, { type AxiosRequestConfig } from "axios";

const DEFAULT_TIMEOUT = 10000;

const globalAxios = axios.create({
  baseURL: `nphies-api/api`,
  headers: {
    "Content-Type": "application/json",
  },
});
export const rcmAxios = axios.create({
  baseURL: `/billing-api`,
  headers: {
    "Content-Type": "application/json",
  },
});
export const dashboardAxios = axios.create({
  baseURL: `dashboard-api/`,
  headers: {
    "Content-Type": "application/json",
  },
});

const normalAxios = axios.create({
  baseURL: `nphies-api/api`,
  headers: {
    "Content-Type": "application/json",
  },
});
const hl7Axios = axios.create({
  baseURL: `hl7/api/v1/hl7`,
  headers: {
    "Content-Type": "application/json",
  },
});
const hl7BaseAxios = axios.create({
  baseURL: `hl7/`,
  headers: {
    "Content-Type": "application/json",
  },
});

const normalAxiosWithOutContentType = axios.create({
  baseURL: `nphies-api/api`,
});

const initializeAxiosTimeout = async () => {
  try {
    const response = await normalAxios.get(
      "/systemRules/?conf_key=axios_time_out",
      {
        timeout: DEFAULT_TIMEOUT,
      },
    );

    const timeoutValue = response.data?.data[0]?.conf_value;
    if (timeoutValue) {
      const timeout = parseInt(timeoutValue, 10);
      if (!isNaN(timeout)) {
        globalAxios.defaults.timeout = timeout;
        return;
      }
    }
    console.warn("Invalid timeout value, using default");
  } catch (error) {
    console.warn(
      "Failed to fetch axios_time_out, using default timeout:",
      error,
    );
  }

  globalAxios.defaults.timeout = DEFAULT_TIMEOUT;
  normalAxios.defaults.timeout = DEFAULT_TIMEOUT * 30;
};

initializeAxiosTimeout().catch((error) => {
  console.error("Error initializing axios timeout:", error);
});

// !! use token
globalAxios.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);
normalAxios.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);
rcmAxios.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);
normalAxiosWithOutContentType.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);
hl7Axios.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);
hl7BaseAxios.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);
dashboardAxios.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export const fetcher = async (args: string | [string, AxiosRequestConfig]) => {
  try {
    const [url, config] = Array.isArray(args) ? args : [args];

    const res = await dashboardAxios.get(url, { ...config });

    return res.data;
  } catch (error) {
    console.error("Failed to fetch:", error);
    throw error;
  }
};

export default globalAxios;
export { normalAxios, normalAxiosWithOutContentType, hl7Axios, hl7BaseAxios };

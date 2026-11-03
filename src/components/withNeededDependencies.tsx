import React, { useEffect } from "react";
import "react-toastify/dist/ReactToastify.css";
import { type Theme } from "@mui/material";
import { toast } from "react-toastify";

import globalAxios, { dashboardAxios, normalAxios } from "../api";

export const withNeededDependencies = <P extends object>(
  Component: React.ComponentType<P>,
): React.FC<
  P & {
    theme: Theme;
    facility_id?: string;
    facilityId?: string | number;
    navigate: (path: string) => void;
  }
> => {
  const WrappedComponent: React.FC<
    P & {
      theme: Theme;
      facility_id?: string;
      facilityId?: string | number;
      navigate: (path: string) => void;
    }
  > = (props) => {
    const { navigate } = props;
    useEffect(() => {
      if (!navigate) {
        console.error(
          "Navigation function is not available. Please ensure that the component is wrapped with a Router.",
        );
        return;
      }
      const globalInterceptor = globalAxios.interceptors.response.use(
        (response) => response,
        (error) => {
          console.error("API Error:", error);

          const status = error.response?.status;

          if (status === 401) {
            sessionStorage.removeItem("token");
            navigate("/login");
          } else if (status === 403) {
            toast.error("You do not have permission to access this resource.", {
              autoClose: false,
            });
          } else if (status === 404) {
            toast.error(
              `${error?.config?.url} ${error?.response?.data?.message}`,
              { autoClose: false },
            );
          } else if (status === 500) {
            toast.error(`${error?.config?.url} Internal server error.`, {
              autoClose: false,
            });
          }

          return Promise.reject(error);
        },
      );

      const normalInterceptor = normalAxios.interceptors.response.use(
        (response) => response,
        (error) => {
          console.error("API Error:", error);

          if (error.response?.status === 401) {
            sessionStorage.removeItem("token");
            navigate("/login");
          }

          return Promise.reject(error);
        },
      );
      const dashboardInterceptor = dashboardAxios.interceptors.response.use(
        (response) => response,
        (error) => {
          console.error("API Error:", error);

          if (error.response?.status === 401) {
            sessionStorage.removeItem("token");
            navigate("/login");
          }

          return Promise.reject(error);
        },
      );

      // ✅ cleanup function to eject interceptors when the component unmounts
      return () => {
        globalAxios.interceptors.response.eject(globalInterceptor);
        normalAxios.interceptors.response.eject(normalInterceptor);
        dashboardAxios.interceptors.response.eject(dashboardInterceptor);
      };
    }, [navigate]);

    return (
      <>
        <Component {...props} />
      </>
    );
  };

  WrappedComponent.displayName = `withNeededDependencies(${
    Component.displayName || Component.name
  })`;

  return WrappedComponent;
};

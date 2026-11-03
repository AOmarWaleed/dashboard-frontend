import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";

const TITLES = {
  CLAIM: {
    arText: "المطالبات - GIVC RCM",
    enText: "Claim - GIVC RCM",
  },
  PRESCRIPTION: {
    arText: "الوصفات الطبية - GIVC RCM",
    enText: "Prescription - GIVC RCM",
  },
  VALIDATION: {
    arText: "التحقق - GIVC RCM",
    enText: "Validation - GIVC RCM",
  },
  ANALYSIS: {
    arText: "التحليل - GIVC RCM",
    enText: "Analysis - GIVC RCM",
  },
  CHECK_ELIGIBILITY: {
    arText: "التحقق من الأهلية - GIVC RCM",
    enText: "Check Eligibility - GIVC RCM",
  },
  APPROVAL: {
    arText: "الموافقات - GIVC RCM",
    enText: "Approval - GIVC RCM",
  },
  ELIGIBILITY: {
    arText: "الأهلية - GIVC RCM",
    enText: "Eligibility - GIVC RCM",
  },
  PAYMENT: {
    arText: "الدفع - GIVC RCM",
    enText: "Payment - GIVC RCM",
  },
  TRANS_MONITOR: {
    arText: "مراقبة المعاملات - GIVC RCM",
    enText: "Trans Monitor - GIVC RCM",
  },
  TRANSACTION_ANALYSIS: {
    arText: "تحليل المعاملات - GIVC RCM",
    enText: "Transaction Analysis - GIVC RCM",
  },
  TRANS_ACTION_ANALYSIS: {
    arText: "تحليل المعاملات - GIVC RCM",
    enText: "Trans-Action Analysis - GIVC RCM",
  },
  BROWSER_DATA: {
    arText: "بيانات المتصفح - GIVC RCM",
    enText: "Browser Data - GIVC RCM",
  },
  DASHBOARD: {
    arText: "لوحة المعلومات - GIVC RCM",
    enText: "Dashboard - GIVC RCM",
  },
  VALIDATION_DASHBOARD: {
    arText: "لوحة معلومات التحقق - GIVC RCM",
    enText: "Validation Dashboard - GIVC RCM",
  },
  SETTINGS: {
    arText: "الإعدادات - GIVC RCM",
    enText: "Settings - GIVC RCM",
  },
};
export default function HandleTitle({
  titleKey = "HOME",
}: {
  titleKey: string;
}) {
  const [directionLocal, setDirectionLocal] = useState<string>("");
  const entry = (TITLES as any)[titleKey];
  const [title, setTitle] = useState<string>(entry ? entry.enText : "GIVC RCM");

  useEffect(() => {
    const direction = localStorage.getItem("dir");
    const current = (TITLES as any)[titleKey];
    if (!current) {
      setTitle("GIVC RCM");
      return;
    }
    if (direction === directionLocal) {
      return;
    }
    setTitle(direction === "rtl" ? current.arText : current.enText);
    setDirectionLocal(direction || "");
  }, [titleKey]);
  return (
    <Helmet>
      <title>{title}</title>
    </Helmet>
  );
}

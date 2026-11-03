export const PERMISSIONS_PREFIXES = {
  preAuth: "approval_32_",
  claim: "claim_33_",
  prescription: "prescription_34_",
  transMonitor: "transMonitor_36_",
  transactionTimeline: "transactionTimeline_30_",
  validation: "validation_39_",
  generic: "generic_0_",
}

export type pageType = keyof typeof PERMISSIONS_PREFIXES;
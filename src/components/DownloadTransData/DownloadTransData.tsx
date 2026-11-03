import { CircularProgress } from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { dashboardAxios } from "../../api";
import { useState } from "react";
import { Secure } from "@givc/shared-components";
import { DisplayMsgDialog } from "@givc/shared-components";
import type { AxiosInstance } from "axios";
function downloadFile(
  data: unknown,
  filename: string,
  type: string = "application/json",
) {
  let fileData = data as BlobPart;

  if (type === "application/json" && typeof data !== "string") {
    fileData = JSON.stringify(data, null, 2);
  }

  const blob = new Blob([fileData], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// Get file extension based on content
function getFileExtensionFromContent(content: string): string {
  if (!content || typeof content !== "string") {
    return "json";
  }

  const trimmed = content.trim();

  // Check for JSON (starts with { or [)
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return "json";
  }

  // Check for XML (starts with <?xml, <xml, <soap:, or any XML tag)
  if (/^<\?xml|^<xml|^<soap:|^<[a-zA-Z_][\w\-.]*>/i.test(trimmed)) {
    return "xml";
  }

  // Check for HTML
  if (/^<html/i.test(trimmed) || /^<!DOCTYPE html/i.test(trimmed)) {
    return "html";
  }

  // Check for HL7 (starts with MSH|)
  if (/^MSH\|/.test(trimmed)) {
    return "hl7";
  }

  // Default to txt
  return "txt";
}

// Get MIME type from extension
function getMimeTypeFromExtension(extension: string): string {
  const types: Record<string, string> = {
    json: "application/json",
    xml: "application/xml",
    html: "text/html",
    hl7: "text/plain",
    txt: "text/plain",
    csv: "text/csv",
    pdf: "application/pdf",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
  return types[extension] || "application/json";
}

// Function to extract and decode document from request string
function extractAndDecodeDocument(
  xmlString: string,
  baseFilename: string,
): boolean {
  try {
    let documentMatch = xmlString.match(
      /<Document[^>]*>([\s\S]*?)<\/Document>/i,
    );
    if (!documentMatch || !documentMatch[1]) {
      documentMatch = xmlString.match(
        /<Document[\s\S]*?>([\s\S]*?)<\/Document>/i,
      );
    }

    if (documentMatch && documentMatch[1]) {
      const base64Content = documentMatch[1].trim();

      if (
        base64Content &&
        /^[A-Za-z0-9+/=\s]+$/.test(base64Content.substring(0, 100))
      ) {
        const binaryString = atob(base64Content);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const blob = new Blob([bytes], { type: "application/xml" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${baseFilename}_doc_request.xml`;
        link.click();
        URL.revokeObjectURL(url);

        console.log(
          `Document decoded and saved as ${baseFilename}_doc_request.xml`,
        );
        return true;
      }
    }

    console.log("No valid Document tag with base64 content found");
    return false;
  } catch (error) {
    console.error("Error extracting document:", error);
    return false;
  }
}

interface DownloadTransDataProps {
  directData?: unknown;
  directFileType?: { name: string; type: string };

  transData?: { api_trans_id: string; response: object; request: object };
  transId?: string;
  responseId?: string;
  setTransData?: (data: unknown) => void;

  onSuccess?: () => void;
  onError?: (error: Error) => void;

  permission: string;
  fallBackText: string;

  extractDocument?: boolean;
  apiClient?: AxiosInstance;
}

export default function DownloadTransData({
  directData,
  directFileType,

  transData,
  transId = "",
  responseId,
  setTransData,

  onSuccess,
  onError,
  permission,
  fallBackText,

  extractDocument = true,
  apiClient = dashboardAxios,
}: DownloadTransDataProps) {
  const [loading, setLoading] = useState(false);
  const [, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  // Helper function to download content with auto-detected type
  function downloadWithAutoDetect(
    content: unknown,
    baseFilename: string,
    suffix: string,
  ) {
    // Convert to string if it's an object
    const contentStr =
      typeof content === "string" ? content : JSON.stringify(content, null, 2);

    // Detect extension from content
    const extension = getFileExtensionFromContent(contentStr);
    const mimeType = getMimeTypeFromExtension(extension);

    // Download with detected extension
    downloadFile(content, `${baseFilename}_${suffix}.${extension}`, mimeType);
    console.log(`Downloaded ${suffix} as ${extension} format`);
  }

  async function handleDirectDownload() {
    if (!directData) {
      throw new Error("No data provided for download");
    }

    const fileName = directFileType?.name || "download";
    const fileType = directFileType?.type || "application/json";
    const extension = getFileExtensionFromContent(
      typeof directData === "string" ? directData : JSON.stringify(directData),
    );

    downloadFile(directData, `${fileName}.${extension}`, fileType);
  }

  async function handleApiDownload() {
    let url = `/eligibility/apiTrans/${transData?.api_trans_id || transId}`;
    if (responseId) {
      url = `/eligibility/responseTrans/${responseId}`;
    }

    const response = await apiClient.get(url);
    const responseData = response.data?.data;

    if (
      !responseData ||
      !Array.isArray(responseData) ||
      responseData.length === 0
    ) {
      // throw new Error("No data received from API");
      setOpen(true);
      return;
    }

    setTransData?.(responseData);

    if (responseId) {
      if (responseData[0]?.response_bundle) {
        const baseFilename = `${responseData[0].api_trans_id}_${responseData[0].response_id}_${responseData[0].response_type}`;

        // Download with auto-detection
        downloadWithAutoDetect(
          responseData[0].response_bundle,
          baseFilename,
          "response",
        );
      } else {
        throw new Error("Response bundle not found");
      }
    } else {
      const baseFilename = `${responseData[0].api_trans_id}_${responseData[0].api_name}_${responseData[0].api_function}`;

      // Download response with auto-detection
      if (responseData[0]?.response) {
        downloadWithAutoDetect(
          responseData[0].response,
          baseFilename,
          "response",
        );
      }

      // Download request with auto-detection
      if (responseData[0]?.request) {
        downloadWithAutoDetect(
          responseData[0].request,
          baseFilename,
          "request",
        );
      }

      // Check request for embedded document
      if (extractDocument && responseData[0]?.request) {
        const documentExtracted = extractAndDecodeDocument(
          responseData[0].request,
          baseFilename,
        );

        if (documentExtracted) {
          console.log(
            "Document decoded and saved as",
            `${baseFilename}_doc_request.xml`,
          );
        }
      }
    }

    return responseData;
  }

  async function getTrans() {
    setLoading(true);
    setError(null);

    try {
      if (directData) {
        await handleDirectDownload();
      } else if (transData?.api_trans_id || transId || responseId) {
        await handleApiDownload();
      } else {
        throw new Error("No data or valid props provided for download");
      }

      onSuccess?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Download failed");
      console.error("Error downloading:", error);
      setError(error.message);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <DisplayMsgDialog
        open={open}
        actionColor="error"
        actionLabel="No data found"
        onClose={() => setOpen(false)}
        getResource={false}
        description="No data received from API"
      />
      <Secure.GLIconButton2
        permission={permission}
        fallBackText={fallBackText}
        color="primary"
        size="small"
        onClick={getTrans}
        disabled={loading}
        aria-label="Download file"
      >
        {loading ? (
          <CircularProgress size={17} />
        ) : (
          <FileDownloadIcon fontSize="small" sx={{ fontSize: "17px" }} />
        )}
      </Secure.GLIconButton2>
    </div>
  );
}

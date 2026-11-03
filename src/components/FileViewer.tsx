import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { dashboardAxios } from '../api';
import { TxtViewer } from './TxtViewer';
import { HL7Viewer } from './HL7Viewer';
import { FhirViewer } from './FhirViewer';
import { JsonViewer } from './JsonViewer';
import { XmlViewer } from './XmlViewer';

export type FileViewerKind = 'txt' | 'json' | 'hl7' | 'fhir' | 'xml';

// const viewerLabels: Record<FileViewerKind, string> = {
//   txt: 'Plain Text',
//   json: 'JSON',
//   hl7: 'HL7 (v2 / v3)',
//   fhir: 'FHIR',
// };

type TransactionItem = Record<string, unknown>;

/** Any XML resource whose root element is one of these is treated as FHIR XML. */
const FHIR_XML_ROOTS = new Set([
  'patient',
  'observation',
  'condition',
  'bundle',
  'encounter',
  'practitioner',
  'practitionerrole',
  'organization',
  'relatedperson',
  'medicationrequest',
  'medicationstatement',
  'diagnosticreport',
  'allergyintolerance',
  'procedure',
  'immunization',
  'claim',
  'claimresponse',
  'coverage',
  'servicerequest',
  'composition',
  'documentreference',
  'specimen',
  'careplan',
  'goal',
  'appointment',
  'slot',
  'schedule',
  'location',
  'healthcareservice',
]);

const FHIR_XML_NAMESPACE = /xmlns(?::[\w.-]+)?\s*=\s*["']https?:\/\/hl7\.org\/fhir["']/i;
const CDA_XML_NAMESPACE = /xmlns(?::[\w.-]+)?\s*=\s*["']urn:hl7-org:v3["']/i;

const RESPONSE_COLLAPSED_KEY = 'fileviewer:response-collapsed';

/** Response panels start collapsed unless the user has explicitly expanded one. */
function readResponseCollapsed(): boolean {
  if (typeof window === 'undefined') return true;

  try {
    const saved = window.localStorage.getItem(RESPONSE_COLLAPSED_KEY);
    if (saved === 'true') return true;
    if (saved === 'false') return false;
  } catch {
    // Storage can throw in private or restricted contexts.
  }

  return true;
}

function writeResponseCollapsed(collapsed: boolean): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(RESPONSE_COLLAPSED_KEY, String(collapsed));
  } catch {
    // Non-fatal: the preference just won't persist.
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFhirJsonResource(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.resourceType === 'string'
  );
}

function getRootElementName(xml: string): string | null {
  const match = xml.match(/<\s*(?!\?|!)\s*([A-Za-z_][\w.-]*)/);
  if (!match) return null;
  return match[1].split(':').pop()?.toLowerCase() ?? null;
}

/**
 * Picks the viewer that best matches the supplied content.
 */
function detectFileViewer(fileName: string, content: string): FileViewerKind {
  const trimmed = content.trim();
  const extension = fileName.split('.').pop()?.toLowerCase() ?? '';

  if (!trimmed) return 'txt';

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const json: unknown = JSON.parse(trimmed);
      return isFhirJsonResource(json) ? 'fhir' : 'json';
    } catch {
      // Let the JSON viewer explain the parse error.
      return 'json';
    }
  }

  if (trimmed.startsWith('<')) {
    const rootElement = getRootElementName(trimmed);

    if (
      FHIR_XML_NAMESPACE.test(trimmed) ||
      (rootElement !== null && FHIR_XML_ROOTS.has(rootElement))
    ) {
      return 'fhir';
    }

    if (rootElement === 'clinicaldocument' || CDA_XML_NAMESPACE.test(trimmed)) {
      return 'hl7';
    }

    return 'xml';
  }

  if (/^MSH\|/m.test(trimmed)) {
    return 'hl7';
  }

  if (extension === 'hl7') return 'hl7';
  if (extension === 'json') return 'json';
  if (extension === 'xml') return 'xml';

  return 'txt';
}

function toViewerContent(value: unknown): string | null {
  if (typeof value === 'string') {
    return value.trim() ? value : null;
  }

  if (value === null || value === undefined) return null;

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function renderContentViewer(kind: FileViewerKind, content: string) {
  switch (kind) {
    case 'fhir':
      return <FhirViewer content={content} />;
    case 'hl7':
      return <HL7Viewer content={content} />;
    case 'json':
      return <JsonViewer content={content} />;
    case 'xml':
      return <XmlViewer content={content} />;
    default:
      return <TxtViewer content={content} />;
  }
}

function ViewerPanel({
  title,
  value,
  collapsible = false,
}: {
  title: string;
  value: unknown;
  collapsible?: boolean;
}) {
  const content = toViewerContent(value);
  const [collapsed, setCollapsed] = useState(
    () => collapsible && readResponseCollapsed(),
  );

  const toggle = collapsible
    ? () => {
        const next = !collapsed;
        setCollapsed(next);
        writeResponseCollapsed(next);
      }
    : undefined;

  return (
    <div style={panelStyle}>
      <h4
        style={{ ...panelHeadingStyle, cursor: toggle ? 'pointer' : undefined }}
        onClick={toggle}
      >
        {title}
        {collapsible && (
          <span
            style={{
              marginLeft: '8px',
              fontSize: '12px',
              color: '#64748b',
            }}
          >
            {collapsed ? '▸' : '▾'}
          </span>
        )}
      </h4>
      {(!collapsible || !collapsed) &&
        (content === null ? (
          <p style={emptyTextStyle}>
            No {title.toLowerCase()} content was returned.
          </p>
        ) : (
          renderContentViewer(detectFileViewer('', content), content)
        ))}
    </div>
  );
}

export function FileViewer({ transDetailsId }: { transDetailsId: string | number }) {
  const transactionId = transDetailsId ? String(transDetailsId) : '';
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!transactionId) {
      setTransactions([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    const loadTransaction = async () => {
      setIsLoading(true);
      setError(null);
      setTransactions([]);

      try {
        const response = await dashboardAxios.get(
          `/eligibility/apiTrans/${transactionId}`,
          { signal: controller.signal },
        );

        const body: unknown = response.data;

        if (!isRecord(body) || !Array.isArray(body.data)) {
          throw new Error('The API returned an unexpected response shape.');
        }

        setTransactions(body.data.filter(isRecord));
      } catch (loadError) {
        if (controller.signal.aborted) return;

        const responseBody = isAxiosError(loadError)
          ? loadError.response?.data
          : null;

        const apiMessage =
          isRecord(responseBody) &&
          (typeof responseBody.msg === 'string' ||
            typeof responseBody.error === 'string')
            ? (responseBody.msg ?? responseBody.error)
            : null;

        setTransactions([]);
        setError(
          typeof apiMessage === 'string' && apiMessage.trim()
            ? apiMessage
            : loadError instanceof Error
              ? loadError.message
              : 'Failed to load the transaction.',
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void loadTransaction();

    return () => controller.abort();
  }, [transactionId]);

  return (
    <div>

      {!transactionId && (
        <p style={{ color: '#64748b', marginTop: 0 }}>
          Select a transaction to preview.
        </p>
      )}

      {isLoading && (
        <p style={{ color: '#475569', marginTop: 0 }}>Loading transaction…</p>
      )}

      {error && (
        <p role="alert" style={{ color: '#b91c1c', marginTop: 0 }}>
          {error}
        </p>
      )}

      {!isLoading && !error && transactionId && transactions.length === 0 && (
        <p style={{ color: '#64748b', marginTop: 0 }}>
          No request or response data was returned.
        </p>
      )}

      {transactions.map((item, index) => (
        <section key={index}>
          <ViewerPanel title="Response" value={item.response} collapsible />
          <ViewerPanel title="Request" value={item.request} />
        </section>
      ))}
    </div>
  );
}

// const transactionStyle = {
//   display: "flex",
//   flexDirection: "column",
//   gap: "16px",
// };

const panelStyle = {
  marginBottom: '16px',
  border: '1px solid #cbd5e1',
  borderRadius: '8px',
  overflow: 'hidden',
  background: '#ffffff',
  flex: 1
};

const panelHeadingStyle = {
  margin: 0,
  padding: '10px 15px',
  background: '#f1f5f9',
  borderBottom: '1px solid #e2e8f0',
  color: '#334155',
  fontSize: '15px',
};

// const viewerBadgeStyle = {
//   marginLeft: '8px',
//   padding: '2px 8px',
//   borderRadius: '999px',
//   background: '#e0f2fe',
//   color: '#0369a1',
//   fontSize: '12px',
//   fontWeight: 600,
//   verticalAlign: 'middle',
// };

const emptyTextStyle = {
  margin: 0,
  padding: '15px',
  color: '#64748b',
  fontSize: '14px',
};

export default FileViewer;

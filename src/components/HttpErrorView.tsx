import { HL7Viewer } from './HL7Viewer';

type HttpErrorViewProps = {
  /** The parsed Axios error payload. */
  payload: Record<string, unknown>;
  /** File name to display when a parent component supplies the content. */
  fileName?: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function readStatus(payload: Record<string, unknown>, config: Record<string, unknown>): string {
  const response = isRecord(payload.response) ? payload.response : null;

  const candidates = [payload.status, response?.status, config.status];
  const status = candidates.find(
    (candidate) => typeof candidate === 'number' || typeof candidate === 'string',
  );

  return status === undefined ? '' : String(status);
}

function statusText(status: string): string {
  const labels: Record<string, string> = {
    '400': 'Bad Request',
    '401': 'Unauthorized',
    '403': 'Forbidden',
    '404': 'Not Found',
    '408': 'Request Timeout',
    '409': 'Conflict',
    '422': 'Unprocessable Entity',
    '429': 'Too Many Requests',
    '500': 'Internal Server Error',
    '502': 'Bad Gateway',
    '503': 'Service Unavailable',
    '504': 'Gateway Timeout',
  };

  return labels[status] ?? 'Request failed';
}

function formatHeaderValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((item) => formatHeaderValue(item)).filter(Boolean).join(', ');
  }

  if (isRecord(value)) {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  if (value === null || value === undefined) return '';
  return String(value);
}

function headerRows(headers: unknown): string[][] {
  if (!isRecord(headers)) return [];

  return Object.entries(headers)
    .map(([name, value]) => [name, formatHeaderValue(value)])
    .filter(([, value]) => Boolean(value));
}

function isHl7Message(value: string): boolean {
  return /^\s*MSH\|/m.test(value);
}

const omittedKeys = new Set([
  '_sessionCache',
  'sockets',
  'freeSockets',
  'requests',
  'ca',
  'cert',
  'key',
  'pfx',
]);

/**
 * Trims values that would otherwise dump certificates, sockets, or session
 * buffers into the page.
 */
function sanitize(value: unknown, depth = 0): unknown {
  if (depth > 5) return '[…]';

  if (Array.isArray(value)) {
    const items = value.slice(0, 25).map((item) => sanitize(item, depth + 1));
    if (value.length > items.length) {
      items.push(`… ${value.length - items.length} more`);
    }
    return items;
  }

  if (isRecord(value)) {
    if (value.type === 'Buffer' && Array.isArray(value.data)) {
      return `<Buffer ${value.data.length} bytes>`;
    }

    const result: Record<string, unknown> = {};

    Object.entries(value).forEach(([key, item]) => {
      if (omittedKeys.has(key)) return;

      // Socket maps are keyed by address and hold large opaque objects.
      if (key === 'sessionCache') return;

      result[key] = sanitize(item, depth + 1);
    });

    return result;
  }

  if (typeof value === 'string' && value.length > 240) {
    return `${value.slice(0, 240)}… (${value.length} characters)`;
  }

  return value;
}

function stringify(value: unknown): string {
  try {
    return JSON.stringify(sanitize(value), null, 2);
  } catch {
    return String(value);
  }
}

export function HttpErrorView({ payload, fileName }: HttpErrorViewProps) {
  const config = isRecord(payload.config) ? payload.config : {};
  const response = isRecord(payload.response) ? payload.response : null;

  const status = readStatus(payload, config);
  const method = readString(config.method).toUpperCase();
  const url = readString(config.url) || readString(config.baseURL);
  const message = readString(payload.message);
  const code = readString(payload.code) || readString(response && response.statusText);
  const requestData = config.data;
  const hl7Message =
    typeof requestData === 'string' && isHl7Message(requestData) ? requestData : '';
  const httpsAgent = isRecord(config.httpsAgent) ? config.httpsAgent : null;
  const stack = readString(payload.stack);

  const summaryFields = [
    { label: 'Method', value: method },
    { label: 'URL', value: url },
    { label: 'Status', value: status ? `${status} ${statusText(status)}` : '' },
    { label: 'Error Code', value: code },
    { label: 'Error Name', value: readString(payload.name) },
  ].filter((field) => field.value);

  const requestHeaders = headerRows(config.headers);
  const responseHeaders = response ? headerRows(response.headers) : [];

  return (
    <div>
      {fileName && (
        <p style={fileNameStyle}>
          Loaded: <strong>{fileName}</strong>
        </p>
      )}

      <div style={bannerStyle} role="alert">
        <div style={bannerHeadingStyle}>
          {status ? `HTTP ${status} ${statusText(status)}` : 'HTTP request failed'}
        </div>
        {message && <p style={bannerMessageStyle}>{message}</p>}
        {(method || url) && (
          <p style={bannerUrlStyle}>
            {method && <strong>{method}</strong>} {url}
          </p>
        )}
      </div>

      <div style={cardStyle}>
        <h4 style={headerStyle}>Request Summary</h4>
        <div style={gridStyle}>
          {summaryFields.map((field) => (
            <div key={field.label} style={field.label === 'URL' ? { gridColumn: 'span 2' } : undefined}>
              <strong>{field.label}:</strong> {field.value}
            </div>
          ))}
        </div>
      </div>

      {hl7Message && (
        <details style={detailsStyle}>
          <summary style={summaryStyle}>Embedded HL7 message</summary>
          <div style={{ marginTop: '10px' }}>
            <HL7Viewer content={hl7Message} />
          </div>
        </details>
      )}

      {!hl7Message && requestData !== undefined && requestData !== null && (
        <details style={detailsStyle}>
          <summary style={summaryStyle}>Request payload</summary>
          <pre style={preStyle}>
            {typeof requestData === 'string' ? requestData : stringify(requestData)}
          </pre>
        </details>
      )}

      {requestHeaders.length > 0 && (
        <details style={detailsStyle}>
          <summary style={summaryStyle}>
            Request headers ({requestHeaders.length})
          </summary>
          <div style={{ marginTop: '8px' }}>{renderTable(requestHeaders)}</div>
        </details>
      )}

      {responseHeaders.length > 0 && (
        <details style={detailsStyle}>
          <summary style={summaryStyle}>
            Response headers ({responseHeaders.length})
          </summary>
          <div style={{ marginTop: '8px' }}>{renderTable(responseHeaders)}</div>
        </details>
      )}

      {httpsAgent && (
        <details style={detailsStyle}>
          <summary style={summaryStyle}>Connection details</summary>
          <pre style={preStyle}>{stringify(httpsAgent)}</pre>
        </details>
      )}

      {stack && (
        <details style={detailsStyle}>
          <summary style={summaryStyle}>Stack trace</summary>
          <pre style={preStyle}>{stack}</pre>
        </details>
      )}

      <details style={detailsStyle}>
        <summary style={summaryStyle}>Request configuration</summary>
        <pre style={preStyle}>{stringify(config)}</pre>
      </details>

      <details style={detailsStyle}>
        <summary style={summaryStyle}>Raw error JSON</summary>
        <pre style={preStyle}>{stringify(payload)}</pre>
      </details>
    </div>
  );
}

function renderTable(rows: string[][]) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '13px' }}>
        <thead>
          <tr>
            <th style={tableHeaderStyle}>Name</th>
            <th style={tableHeaderStyle}>Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([name, value]) => (
            <tr key={name}>
              <td style={tableCellStyle}>{name}</td>
              <td style={tableCellStyle}>{value || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const fileNameStyle = {
  color: '#64748b',
  marginTop: 0,
};

const bannerStyle = {
  marginBottom: '16px',
  padding: '14px 16px',
  border: '1px solid #fca5a5',
  borderLeft: '5px solid #dc2626',
  borderRadius: '8px',
  background: '#fef2f2',
};

const bannerHeadingStyle = {
  color: '#b91c1c',
  fontSize: '17px',
  fontWeight: 700,
};

const bannerMessageStyle = {
  margin: '6px 0 0',
  color: '#7f1d1d',
  fontSize: '14px',
};

const bannerUrlStyle = {
  margin: '6px 0 0',
  color: '#991b1b',
  fontSize: '13px',
  wordBreak: 'break-word' as const,
};

const cardStyle = {
  marginBottom: '16px',
  border: '1px solid #cbd5e1',
  padding: '15px',
  borderRadius: '8px',
  background: '#f8fafc',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
};

const headerStyle = {
  margin: '0 0 12px 0',
  color: '#0284c7',
  borderBottom: '2px solid #e2e8f0',
  paddingBottom: '6px',
  fontSize: '16px',
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '8px 16px',
  fontSize: '14px',
};

const detailsStyle = {
  marginBottom: '12px',
  border: '1px solid #cbd5e1',
  borderRadius: '8px',
  padding: '10px 14px',
  background: '#ffffff',
};

const summaryStyle = {
  cursor: 'pointer',
  color: '#0369a1',
  fontWeight: 600,
  fontSize: '14px',
};

const preStyle = {
  margin: '8px 0 0',
  padding: '10px',
  border: '1px solid #e2e8f0',
  borderRadius: '6px',
  background: '#f8fafc',
  color: '#334155',
  fontSize: '12px',
  whiteSpace: 'pre-wrap' as const,
  overflowWrap: 'anywhere' as const,
};

const tableHeaderStyle = {
  border: '1px solid #cbd5e1',
  background: '#e2e8f0',
  padding: '6px 8px',
  textAlign: 'left' as const,
  color: '#0f172a',
  whiteSpace: 'nowrap' as const,
};

const tableCellStyle = {
  border: '1px solid #cbd5e1',
  padding: '6px 8px',
  verticalAlign: 'top' as const,
  color: '#334155',
  wordBreak: 'break-word' as const,
};

export default HttpErrorView;

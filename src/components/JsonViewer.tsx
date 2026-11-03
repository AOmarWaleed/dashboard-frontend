import { useMemo, useRef, useState } from 'react';
import type { ChangeEvent, CSSProperties, ReactNode } from 'react';
import { HttpErrorView } from './HttpErrorView';
import { isHttpErrorPayload } from '../lib/httpError';

type JsonViewerProps = {
  /** When set, the viewer renders this JSON instead of its own upload control. */
  content?: string;
  /** File name to display when a parent component supplies the content. */
  fileName?: string;
};

type JsonParseResult = {
  value: unknown;
  error: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function formatPrimitive(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  return String(value);
}

function parseJson(text: string | null): JsonParseResult {
  if (text === null) return { value: null, error: null };

  try {
    return { value: JSON.parse(text) as unknown, error: null };
  } catch {
    return { value: null, error: 'Invalid JSON format.' };
  }
}

function renderJsonValue(value: unknown): ReactNode {
  if (value === null || value === undefined) {
    return <span style={nullTextStyle}>null</span>;
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    const text = String(value);
    return <span style={primitiveStyle}>{text || '—'}</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span style={emptyTextStyle}>Empty array</span>;
    }

    if (value.every((item) => item === null || typeof item !== 'object')) {
      return <span style={primitiveStyle}>{value.map(formatPrimitive).join(', ')}</span>;
    }

    return (
      <div style={{ display: 'grid', gap: '8px' }}>
        {value.map((item, index) => (
          <div key={index} style={arrayItemStyle}>
            <span style={indexStyle}>{index + 1}.</span>
            <div style={{ flex: 1, minWidth: 0 }}>{renderJsonValue(item)}</div>
          </div>
        ))}
      </div>
    );
  }

  if (isRecord(value)) {
    const entries = Object.entries(value);

    if (entries.length === 0) {
      return <span style={emptyTextStyle}>Empty object</span>;
    }

    return <JsonFieldGrid entries={entries} />;
  }

  return <span style={primitiveStyle}>{String(value)}</span>;
}

function JsonFieldGrid({ entries }: { entries: Array<[string, unknown]> }) {
  return (
    <div style={fieldGridStyle}>
      {entries.map(([key, value]) => {
        const isComplex = typeof value === 'object' && value !== null;

        return (
          <div
            key={key}
            style={{ gridColumn: isComplex ? 'span 2' : 'auto', minWidth: 0 }}
          >
            <strong style={keyStyle}>{key}:</strong>{' '}
            {isComplex ? (
              <div style={nestedGroupStyle}>{renderJsonValue(value)}</div>
            ) : (
              renderJsonValue(value)
            )}
          </div>
        );
      })}
    </div>
  );
}

function renderJsonRoot(value: unknown): ReactNode {
  if (Array.isArray(value)) {
    return (
      <div style={cardStyle}>
        {/* <h4 style={cardHeadingStyle}>
          JSON Array
          <span style={countStyle}>
            {' '}· {value.length} {value.length === 1 ? 'item' : 'items'}
          </span>
        </h4> */}
        {renderJsonValue(value)}
      </div>
    );
  }

  if (isRecord(value)) {
    const entries = Object.entries(value);

    return (
      <div style={cardStyle}>
        {/* <h4 style={cardHeadingStyle}>
          JSON Object
          <span style={countStyle}>
            {' '}· {entries.length} {entries.length === 1 ? 'field' : 'fields'}
          </span>
        </h4> */}
        {entries.length === 0 ? (
          <p style={emptyTextStyle}>The JSON object is empty.</p>
        ) : (
          <JsonFieldGrid entries={entries} />
        )}
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      {/* <h4 style={cardHeadingStyle}>JSON Value</h4> */}
      {renderJsonValue(value)}
    </div>
  );
}

export function JsonViewer({ content, fileName: providedFileName }: JsonViewerProps = {}) {
  const [uploadedContent, setUploadedContent] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isEmbedded = content !== undefined;
  const displayedContent = isEmbedded ? content : uploadedContent;
  const displayedFileName = isEmbedded ? providedFileName ?? null : uploadedFileName;
  const parsed = useMemo(() => parseJson(displayedContent), [displayedContent]);

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);

    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result;

      if (typeof text !== 'string') {
        setUploadedContent(null);
        setError('Could not read the JSON file.');
        return;
      }

      setUploadedContent(text);
      setError(null);
    };

    reader.onerror = () => {
      setUploadedContent(null);
      setError('Could not read the JSON file.');
    };

    reader.readAsText(file);

    // Reset the input so that re-selecting the same file fires `onChange` again.
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleClear = () => {
    setUploadedContent(null);
    setUploadedFileName(null);
    setError(null);
  };

  return (
    <div style={{ padding: '20px' }}>

      {!isEmbedded && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <input
            ref={inputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileUpload}
          />
          {uploadedContent !== null && (
            <button type="button" onClick={handleClear} style={{ padding: '6px 12px', cursor: 'pointer' }}>
              Clear
            </button>
          )}
        </div>
      )}

      {displayedFileName && (
        <p style={{ color: '#64748b', marginTop: 0 }}>
          Loaded: <strong>{displayedFileName}</strong>
        </p>
      )}

      {(error || parsed.error) && (
        <p role="alert" style={{ color: '#b91c1c', marginTop: 0 }}>
          {error ?? parsed.error}
        </p>
      )}

      {displayedContent !== null &&
        !parsed.error &&
        (isHttpErrorPayload(parsed.value) ? (
          <HttpErrorView payload={parsed.value} />
        ) : (
          renderJsonRoot(parsed.value)
        ))}
    </div>
  );
}

const fieldGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  gap: '8px 16px',
  fontSize: '14px',
};

const nestedGroupStyle: CSSProperties = {
  marginTop: '4px',
  paddingLeft: '12px',
  borderLeft: '2px solid #cbd5e1',
  display: 'grid',
  gap: '6px',
};

const cardStyle: CSSProperties = {
  border: '1px solid #cbd5e1',
  padding: '15px',
  borderRadius: '8px',
  background: '#f8fafc',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
};

const keyStyle: CSSProperties = {
  color: '#334155',
};

const primitiveStyle: CSSProperties = {
  color: '#0f172a',
  wordBreak: 'break-word',
};

const nullTextStyle: CSSProperties = {
  color: '#94a3b8',
  fontStyle: 'italic',
};

const emptyTextStyle: CSSProperties = {
  margin: 0,
  color: '#64748b',
  fontSize: '14px',
};

const arrayItemStyle: CSSProperties = {
  display: 'flex',
  gap: '6px',
};

const indexStyle: CSSProperties = {
  color: '#64748b',
  minWidth: '18px',
};

export default JsonViewer;

import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';

type TxtViewerProps = {
  /** When set, the viewer renders this content instead of its own upload control. */
  content?: string;
  /** File name to display when a parent component supplies the content. */
  fileName?: string;
};

export function TxtViewer({ content, fileName: providedFileName }: TxtViewerProps = {}) {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isEmbedded = content !== undefined;
  const displayedContent = isEmbedded ? content : textContent;
  const displayedFileName = isEmbedded ? providedFileName ?? null : fileName;

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text !== 'string') {
        setError('Could not read the text file.');
        setTextContent(null);
        return;
      }
      setTextContent(text);
      setError(null);
    };

    reader.onerror = () => {
      setError('Could not read the text file.');
      setTextContent(null);
    };

    reader.readAsText(file);

    // Reset input so re-selecting the same file triggers onChange
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleClear = () => {
    setTextContent(null);
    setFileName(null);
    setError(null);
  };

  return (
    <div style={{ padding: '20px' }}>

      {!isEmbedded && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <input
            ref={inputRef}
            type="file"
            accept=".txt,.log,.md,.csv"
            onChange={handleFileUpload}
          />
          {textContent !== null && (
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

      {error && (
        <p role="alert" style={{ color: '#b91c1c', marginTop: 0 }}>
          {error}
        </p>
      )}

      {displayedContent !== null && (
        <div
          style={{
            border: '1px solid #cbd5e1',
            padding: '15px',
            borderRadius: '8px',
            background: '#f8fafc',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'Consolas, Monaco, "Courier New", monospace',
              fontSize: '14px',
              margin: 0,
              maxHeight: '500px',
              overflowY: 'auto',
              color: '#334155',
            }}
          >
            {displayedContent}
          </pre>
        </div>
      )}
    </div>
  );
}

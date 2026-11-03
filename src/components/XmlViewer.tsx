import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { detectXmlShape, extractEmbeddedDocuments, parseXml } from '../lib/xml';
import { CdaDocumentView } from './xml/CdaDocumentView';
import { RegistryResponseView } from './xml/RegistryResponseView';
import { XdsSubmissionView } from './xml/XdsSubmissionView';
import { XmlTreeView } from './xml/XmlTreeView';

type XmlViewerProps = {
  /** When set, the viewer renders this content instead of its own upload control. */
  content?: string;
  /** File name to display when a parent component supplies the content. */
  fileName?: string;
};

/**
 * Dispatches a parsed document to the view that matches its structural shape.
 * Unknown XML falls back to the generic tree.
 */
function renderXmlDocument(xmlDoc: Document): ReactNode {
  const shape = detectXmlShape(xmlDoc);

  if (shape === 'clinical-document') {
    return <CdaDocumentView doc={xmlDoc} />;
  }

  if (shape === 'registry-response') {
    return <RegistryResponseView doc={xmlDoc} />;
  }

  if (shape === 'xds-submission') {
    const documents = extractEmbeddedDocuments(xmlDoc);

    if (documents.length > 0) {
      return (
        <XdsSubmissionView
          doc={xmlDoc}
          documents={documents}
          renderDocument={renderXmlDocument}
        />
      );
    }
  }

  return <XmlTreeView doc={xmlDoc} />;
}

export function XmlViewer({ content, fileName: providedFileName }: XmlViewerProps = {}) {
  const [xmlContent, setXmlContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parsedDoc, setParsedDoc] = useState<Document | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isEmbedded = content !== undefined;
  const displayedContent = isEmbedded ? content : xmlContent;
  const displayedFileName = isEmbedded ? providedFileName ?? null : fileName;

  useEffect(() => {
    if (!displayedContent) {
      setParsedDoc(null);
      setError(null);
      return;
    }

    const document = parseXml(displayedContent);

    if (!document) {
      setParsedDoc(null);
      setError('Invalid XML format.');
      return;
    }

    setParsedDoc(document);
    setError(null);
  }, [displayedContent]);

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);
    setParsedDoc(null);

    const reader = new FileReader();

    reader.onload = (readerEvent) => {
      const text = readerEvent.target?.result;
      if (typeof text !== 'string') {
        setError('Could not read the XML file.');
        setXmlContent(null);
        return;
      }
      setXmlContent(text);
    };

    reader.onerror = () => {
      setError('Could not read the XML file.');
      setXmlContent(null);
    };

    reader.readAsText(file);

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleClear = () => {
    setXmlContent(null);
    setFileName(null);
    setError(null);
    setParsedDoc(null);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      {!isEmbedded && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <input ref={inputRef} type="file" accept=".xml,.json" onChange={handleFileUpload} />
          {xmlContent !== null && (
            <button type="button" onClick={handleClear} style={clearButtonStyle}>
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

      {parsedDoc && renderXmlDocument(parsedDoc)}
    </div>
  );
}

const clearButtonStyle = {
  padding: '6px 12px',
  cursor: 'pointer',
};

export default XmlViewer;

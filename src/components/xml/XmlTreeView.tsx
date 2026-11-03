import { useState } from 'react';
import type { ReactNode } from 'react';
import { decodeBase64Utf8, isBase64Like, tagOf } from '../../lib/xml';

type DecodedState = { path: number[]; content: string } | null;

function truncateText(value: string, max: number): string {
  if (value.length <= max) return value;
  return value.slice(0, max).trim() + '…';
}

/**
 * Generic XML tree. Used only when the document does not match a known shape.
 */
export function XmlTreeView({ doc }: { doc: Document }) {
  const [decoded, setDecoded] = useState<DecodedState>(null);

  return (
    <div>
      {renderXmlNode(doc.documentElement, 0, 0, [0], decoded, setDecoded)}
    </div>
  );
}

function renderXmlNode(
  element: Element,
  depth: number,
  index: number,
  path: number[],
  decoded: DecodedState,
  setDecoded: (value: DecodedState) => void,
): ReactNode {
  const tagName = tagOf(element);
  const attributes = Array.from(element.attributes);
  const childElements = Array.from(element.children);
  const directText = Array.from(element.childNodes)
    .filter((node) => node.nodeType === Node.TEXT_NODE)
    .map((node) => node.textContent?.trim() ?? '')
    .filter(Boolean)
    .join(' ')
    .trim();

  const stripe = index % 2 === 0 ? '#ffffff' : '#f1f5f9';
  const hasChildren = childElements.length > 0;
  const hasAttributes = attributes.length > 0;
  const hasText = directText.length > 0;

  const isBase64 = isBase64Like(directText);
  const showDecoded =
    decoded !== null &&
    decoded.path.length === path.length &&
    decoded.path.every((part, partIndex) => part === path[partIndex]);

  return (
    <div
      key={path.join('-')}
      style={{
        ...nodeContainerStyle(depth),
        backgroundColor: stripe,
      }}
    >
      <details open={depth === 0} style={{ margin: 0 }}>
        <summary
          style={{
            ...summaryStyle,
            color: '#0284c7',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={tagStyle}>{tagName}</span>
          {hasAttributes && (
            <span style={badgeStyle}>
              {attributes.length} attribute{attributes.length !== 1 ? 's' : ''}
            </span>
          )}
          {!hasChildren && hasText && (
            <span style={previewStyle}>{truncateText(directText, 80)}</span>
          )}
        </summary>
        <div style={{ marginTop: '6px', paddingLeft: '16px' }}>
          {hasAttributes && (
            <div style={{ display: 'grid', gap: '2px', marginBottom: '6px' }}>
              {attributes.map((attribute) => (
                <div key={attribute.name} style={attributeRowStyle}>
                  <span style={attributeNameStyle}>{attribute.name}</span>
                  {'='}
                  <span style={attributeValueStyle}>{`"${attribute.value}"`}</span>
                </div>
              ))}
            </div>
          )}
          {!hasChildren && hasText && (
            <div style={{ marginBottom: '6px', wordBreak: 'break-word' }}>
              {isBase64 ? (
                <>
                  <button
                    type="button"
                    onClick={() => setDecoded({ path, content: directText })}
                    style={decodeButtonStyle}
                  >
                    Decode base64
                  </button>
                  {showDecoded && (
                    <div style={{ marginTop: '6px' }}>
                      <span style={decodedLabelStyle}>Decoded:</span>{' '}
                      {decodeBase64Utf8(decoded?.content ?? '') ?? 'Unable to decode.'}
                    </div>
                  )}
                </>
              ) : (
                directText
              )}
            </div>
          )}
          {hasChildren && (
            <div style={{ marginTop: '4px' }}>
              {childElements.map((child, childIndex) =>
                renderXmlNode(
                  child,
                  depth + 1,
                  childIndex,
                  [...path, childIndex],
                  decoded,
                  setDecoded,
                ),
              )}
            </div>
          )}
        </div>
      </details>
    </div>
  );
}

function nodeContainerStyle(depth: number) {
  return {
    padding: '6px 10px',
    borderRadius: '4px',
    marginBottom: '6px',
    fontSize: '13px',
    paddingLeft: 12 + depth * 14,
  };
}

const summaryStyle = {
  margin: 0,
  padding: '2px 0',
};

const tagStyle = {
  fontFamily: 'monospace',
  fontSize: '13px',
};

const badgeStyle = {
  fontSize: '11px',
  color: '#64748b',
  background: '#e2e8f0',
  padding: '1px 6px',
  borderRadius: '10px',
};

const previewStyle = {
  fontSize: '11px',
  color: '#0f172a',
};

const attributeRowStyle = {
  fontSize: '12px',
  color: '#334155',
};

const attributeNameStyle = {
  color: '#0f172a',
  fontWeight: 600,
};

const attributeValueStyle = {
  color: '#0369a1',
};

const decodeButtonStyle = {
  fontSize: '11px',
  padding: '2px 8px',
  borderRadius: '4px',
  border: '1px solid #cbd5e1',
  background: '#ffffff',
  color: '#0369a1',
  cursor: 'pointer',
  marginRight: '8px',
};

const decodedLabelStyle = {
  fontSize: '12px',
  color: '#475569',
  fontWeight: 600,
};

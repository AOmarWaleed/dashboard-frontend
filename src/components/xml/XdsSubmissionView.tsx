import type { CSSProperties, ReactNode } from 'react';
import { attr, directChildren, findAll, findFirst, tagOf, textOf } from '../../lib/xml';

type XdsSubmissionViewProps = {
  doc: Document;
  documents: Document[];
  renderDocument: (xmlDoc: Document) => ReactNode;
};

export function XdsSubmissionView({ doc, documents, renderDocument }: XdsSubmissionViewProps) {
  const metadataObjects = [...findAll(doc, 'extrinsicobject'), ...findAll(doc, 'registrypackage')];

  return (
    <div style={containerStyle}>
      {documents.map((embeddedDoc, index) => (
        <section key={index}>
          {documents.length > 1 && (
            <h4 style={embeddedHeadingStyle}>
              Embedded document {index + 1} of {documents.length}
            </h4>
          )}
          {renderDocument(embeddedDoc)}
        </section>
      ))}

      {metadataObjects.length > 0 && (
        <details style={metadataDetailsStyle}>
          <summary style={metadataSummaryStyle}>Submission metadata</summary>
          <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {metadataObjects.map((object, index) => (
              <MetadataObjectCard key={index} object={object} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function MetadataObjectCard({ object }: { object: Element }) {
  const attributes = Array.from(object.attributes).filter((attribute) => attribute.value.trim());
  const slots = directChildren(object, 'slot');
  const classifications = directChildren(object, 'classification');
  const identifiers = directChildren(object, 'externalidentifier');
  const name = textOf(findFirst(object, 'name')) || attr(object, 'id');

  return (
    <div style={metadataCardStyle}>
      <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
        {tagOf(object)} — {name || 'Unnamed'}
      </div>

      {attributes.length > 0 && (
        <dl style={attributeGridStyle}>
          {attributes.map((attribute) => (
            <div key={attribute.name} style={{ display: 'contents' }}>
              <dt style={attributeNameStyle}>{attribute.name}</dt>
              <dd style={attributeValueStyle}>{attribute.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {slots.map((slot, index) => (
        <div key={`slot-${index}`} style={{ marginTop: '6px', fontSize: '12px' }}>
          <strong style={{ color: '#334155' }}>{attr(slot, 'name') || 'Slot'}:</strong>{' '}
          <span style={{ color: '#0369a1' }}>
            {findAll(slot, 'value')
              .map((value) => textOf(value))
              .filter(Boolean)
              .join(' | ') || '—'}
          </span>
        </div>
      ))}

      {classifications.map((classification, index) => (
        <div key={`classification-${index}`} style={{ marginTop: '6px', fontSize: '12px' }}>
          <strong style={{ color: '#334155' }}>
            {attr(classification, 'classificationScheme') || 'Classification'}
          </strong>
          {attr(classification, 'nodeRepresentation') && (
            <span style={{ color: '#0369a1' }}>{` — ${attr(classification, 'nodeRepresentation')}`}</span>
          )}
        </div>
      ))}

      {identifiers.map((identifier, index) => (
        <div key={`identifier-${index}`} style={{ marginTop: '6px', fontSize: '12px' }}>
          <strong style={{ color: '#334155' }}>
            {textOf(findFirst(identifier, 'localizedstring')) || attr(identifier, 'identificationScheme')}
          </strong>
          <span style={{ color: '#0369a1' }}>{armor(attr(identifier, 'value'))}</span>
        </div>
      ))}
    </div>
  );
}

function armor(value: string): string {
  return value ? ` — ${value}` : '';
}

const containerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const embeddedHeadingStyle: CSSProperties = {
  margin: '0 0 8px 0',
  fontSize: '14px',
  color: '#334155',
};

const metadataDetailsStyle: CSSProperties = {
  borderTop: '1px solid #e2e8f0',
  paddingTop: '12px',
  fontSize: '12px',
  color: '#475569',
};

const metadataSummaryStyle: CSSProperties = {
  cursor: 'pointer',
  color: '#0369a1',
  fontWeight: 600,
};

const metadataCardStyle: CSSProperties = {
  border: '1px solid #e2e8f0',
  borderRadius: '6px',
  padding: '10px 12px',
  background: '#ffffff',
};

const attributeGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(90px, max-content) 1fr',
  gap: '2px 10px',
  margin: 0,
  fontSize: '12px',
};

const attributeNameStyle: CSSProperties = {
  margin: 0,
  fontWeight: 600,
  color: '#334155',
};

const attributeValueStyle: CSSProperties = {
  margin: 0,
  color: '#0369a1',
  fontFamily: 'Consolas, Monaco, "Courier New", monospace',
  wordBreak: 'break-word',
};

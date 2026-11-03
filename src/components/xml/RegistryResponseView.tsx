import type { CSSProperties } from 'react';
import { attr, findAll, findFirst, textOf } from '../../lib/xml';

type Tone = 'success' | 'warning' | 'error' | 'neutral';

const TONE_STYLES: Record<
  Tone,
  { background: string; border: string; heading: string; text: string }
> = {
  success: { background: '#f0fdf4', border: '#bbf7d0', heading: '#16a34a', text: '#15803d' },
  warning: { background: '#fffbeb', border: '#fde68a', heading: '#b45309', text: '#92400e' },
  error: { background: '#fef2f2', border: '#fecaca', heading: '#dc2626', text: '#b91c1c' },
  neutral: { background: '#f8fafc', border: '#cbd5e1', heading: '#0369a1', text: '#475569' },
};

function humanize(value: string): string {
  if (!value) return 'Unknown';

  const tail = value.includes(':') ? value.split(':').pop() ?? value : value;
  const spaced = tail
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim();

  return spaced.replace(/\b[a-z]/g, (character) => character.toUpperCase());
}

function statusTone(value: string): Tone {
  const normalized = value.toLowerCase();

  if (normalized.includes('success')) return 'success';
  if (normalized.includes('validation') || normalized.includes('partial')) return 'warning';
  if (
    normalized.includes('error') ||
    normalized.includes('failure') ||
    normalized.includes('failed') ||
    normalized.includes('reject')
  ) {
    return 'error';
  }
  return 'neutral';
}

export function RegistryResponseView({ doc }: { doc: Document }) {
  const registryResponse = findFirst(doc, 'registryresponse');
  if (!registryResponse) return null;

  const status = attr(registryResponse, 'status');
  const tone = statusTone(status);
  const toneStyle = TONE_STYLES[tone];

  const slotMessages = findAll(doc, 'responseslotlist').flatMap((slotList) =>
    findAll(slotList, 'value')
      .map((value) => textOf(value))
      .filter(Boolean),
  );

  const errorList = findFirst(doc, 'registryerrorlist');
  const highestSeverity = attr(errorList, 'highestSeverity');

  const errors = findAll(doc, 'registryerror').map((error) => {
    const attributes = Array.from(error.attributes).map((attribute) => ({
      name: attribute.name,
      value: attribute.value,
    }));

    return {
      attributes,
      details: attr(error, 'codeContext') || textOf(error),
    };
  });

  const relatesTo = Array.from(
    new Set(findAll(doc, 'relatesto').map((node) => textOf(node)).filter(Boolean)),
  );
  const messageId = textOf(findFirst(doc, 'messageid'));
  const action = textOf(findFirst(doc, 'action'));

  return (
    <div style={containerStyle}>
      <div style={{ background: toneStyle.background, border: `1px solid ${toneStyle.border}`, padding: '12px 16px', borderRadius: '6px' }}>
        <h3 style={{ margin: '0 0 4px 0', color: toneStyle.heading, fontSize: '18px' }}>
          Registry Response
        </h3>
        {status && (
          <div style={{ fontSize: '12px', color: toneStyle.text, fontWeight: 600 }}>
            Status: {humanize(status)}
          </div>
        )}
        {highestSeverity && (
          <div style={{ fontSize: '12px', color: toneStyle.text }}>
            Highest severity: {humanize(highestSeverity)}
          </div>
        )}
      </div>

      {(slotMessages.length > 0 || errors.length > 0) && (
        <div style={cardStyle}>
          <h4 style={headerStyle}>Messages</h4>
          {slotMessages.length > 0 && (
            <ul style={listStyle}>
              {slotMessages.map((message, index) => (
                <li key={`slot-${index}`}>{message}</li>
              ))}
            </ul>
          )}
          {errors.map((error, index) => (
            <div key={`error-${index}`} style={errorCardStyle}>
              {error.details && (
                <div style={{ color: '#991b1b', marginBottom: '6px', whiteSpace: 'pre-wrap' }}>
                  {error.details}
                </div>
              )}
              {error.attributes.length > 0 && (
                <dl style={attributeGridStyle}>
                  {error.attributes.map((attribute) => (
                    <div key={attribute.name} style={{ display: 'contents' }}>
                      <dt style={attributeNameStyle}>{attribute.name}</dt>
                      <dd style={attributeValueStyle}>{attribute.value || '—'}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          ))}
        </div>
      )}

      {(relatesTo.length > 0 || messageId || action) && (
        <div style={cardStyle}>
          <h4 style={headerStyle}>Message Tracking</h4>
          <dl style={attributeGridStyle}>
            {messageId && (
              <div style={{ display: 'contents' }}>
                <dt style={attributeNameStyle}>Message ID</dt>
                <dd style={attributeValueStyle}>{messageId}</dd>
              </div>
            )}
            {action && (
              <div style={{ display: 'contents' }}>
                <dt style={attributeNameStyle}>Action</dt>
                <dd style={attributeValueStyle}>{humanize(action)}</dd>
              </div>
            )}
            {relatesTo.map((reference) => (
              <div key={reference} style={{ display: 'contents' }}>
                <dt style={attributeNameStyle}>Relates to</dt>
                <dd style={attributeValueStyle}>{reference}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}

const containerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  fontSize: '14px',
  color: '#334155',
};

const cardStyle: CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '6px',
  padding: '12px 16px',
};

const headerStyle: CSSProperties = {
  margin: '0 0 8px 0',
  fontSize: '14px',
  color: '#0f172a',
  borderBottom: '1px solid #f1f5f9',
  paddingBottom: '4px',
};

const listStyle: CSSProperties = {
  margin: '0 0 8px 0',
  paddingLeft: '18px',
  color: '#475569',
};

const errorCardStyle: CSSProperties = {
  background: '#fef2f2',
  border: '1px solid #fecaca',
  padding: '10px',
  borderRadius: '4px',
  fontSize: '13px',
  marginTop: '8px',
};

const attributeGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(120px, max-content) 1fr',
  gap: '4px 12px',
  margin: 0,
  fontSize: '13px',
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

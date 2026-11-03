import type { CSSProperties } from 'react';
import {
  attr,
  directChildren,
  findAll,
  findFirst,
  firstReferenceText,
  formatHl7Date,
  tagOf,
  textOf,
  textOrReference,
} from '../../lib/xml';

type Row = {
  item: string;
  secondary: string;
  value: string;
  unit: string;
  range: string;
  interpretation: string;
  interpretationCode: string;
  status: string;
  date: string;
};

function hasAncestor(element: Element, tag: string, boundary: Element): boolean {
  let parent = element.parentElement;
  while (parent && parent !== boundary) {
    if (tagOf(parent) === tag) return true;
    parent = parent.parentElement;
  }
  return false;
}

function insideNestedSection(element: Element, section: Element): boolean {
  return hasAncestor(element, 'section', section);
}

function labelFromCode(
  xmlDoc: Document,
  codeElement: Element | null,
): { label: string; code: string } {
  if (!codeElement) return { label: '', code: '' };

  const code = attr(codeElement, 'code');
  const display = attr(codeElement, 'displayName');
  const referenced = firstReferenceText(xmlDoc, codeElement);
  const rawLabel = display || referenced || code || textOf(codeElement);
  const label = rawLabel.replace(/^[\s,;:.-]+|[\s,;:.-]+$/g, '');

  return {
    label,
    code: label === code ? '' : code,
  };
}

function readValue(xmlDoc: Document, observation: Element): { value: string; unit: string } {
  const valueElement = findFirst(observation, 'value');
  if (!valueElement) return { value: '', unit: '' };

  const raw = attr(valueElement, 'value');
  const display = attr(valueElement, 'displayName');
  const unit = attr(valueElement, 'unit');

  if (raw) return { value: raw, unit };
  if (display) return { value: display, unit };

  return { value: textOrReference(xmlDoc, valueElement), unit };
}

function readRange(xmlDoc: Document, observation: Element): string {
  const referenceRange = findFirst(observation, 'referencerange');
  if (!referenceRange) return '';

  let value = textOrReference(xmlDoc, findFirst(referenceRange, 'text'));

  if (!value) {
    const observationRange = findFirst(referenceRange, 'observationrange');
    const low = attr(findFirst(observationRange, 'low'), 'value');
    const high = attr(findFirst(observationRange, 'high'), 'value');
    if (low || high) value = `${low || '—'} – ${high || '—'}`;
  }

  return value.replace(/^\s*(normal\s+)?range\s*:?\s*/i, '').trim();
}

function readStatus(element: Element): string {
  const statusElement = findFirst(element, 'observationstatus') ?? findFirst(element, 'statuscode');
  return attr(statusElement, 'displayName') || attr(statusElement, 'code');
}

function readDate(element: Element): string {
  const raw = attr(findFirst(element, 'effectivetime'), 'value');
  return raw ? formatHl7Date(raw) : '';
}

function readInterpretation(
  xmlDoc: Document,
  observation: Element,
  referenceRange: Element | null,
): { label: string; code: string } {
  let interpretation: Element | null = null;

  for (const candidate of findAll(observation, 'interpretationcode')) {
    if (!hasAncestor(candidate, 'referencerange', observation)) {
      interpretation = candidate;
      break;
    }
  }

  const resolve = (element: Element | null): { label: string; code: string } => {
    if (!element) return { label: '', code: '' };
    const code = attr(element, 'code');
    const display = attr(element, 'displayName');
    const referenced = firstReferenceText(xmlDoc, element);
    return { label: display || referenced || code, code };
  };

  const direct = resolve(interpretation);
  if (direct.label) return direct;

  return resolve(findFirst(referenceRange, 'interpretationcode'));
}

function observationRow(xmlDoc: Document, observation: Element): Row {
  const { label, code } = labelFromCode(xmlDoc, findFirst(observation, 'code'));
  const { value, unit } = readValue(xmlDoc, observation);
  const referenceRange = findFirst(observation, 'referencerange');
  const interpretation = readInterpretation(xmlDoc, observation, referenceRange);

  return {
    item: label || '(unnamed)',
    secondary: code,
    value,
    unit,
    range: readRange(xmlDoc, observation),
    interpretation: interpretation.label,
    interpretationCode: interpretation.code,
    status: readStatus(observation),
    date: readDate(observation),
  };
}

function entryRow(xmlDoc: Document, entry: Element): Row {
  const codeElement =
    directChildren(entry, 'code')[0] ?? findFirst(findFirst(entry, 'playingentity'), 'code');
  const { label, code } = labelFromCode(xmlDoc, codeElement);
  const priorityElement = findFirst(entry, 'prioritycode');
  const priority = attr(priorityElement, 'displayName') || attr(priorityElement, 'code');

  const secondary = [code, priority ? `Priority: ${priority}` : ''].filter(Boolean).join(' · ');

  return {
    item: label || 'Unnamed item',
    secondary,
    value: '',
    unit: '',
    range: '',
    interpretation: '',
    interpretationCode: '',
    status: readStatus(entry),
    date: readDate(entry),
  };
}

function rowBackground(row: Row): string | undefined {
  const flag = (row.interpretationCode || row.interpretation).trim().toUpperCase();

  if (['H', 'HH', 'A', 'AA', 'D', 'R'].includes(flag)) return '#fef2f2';
  if (['L', 'LL'].includes(flag)) return '#fffbeb';

  return undefined;
}

export function CdaSectionView({ doc, section }: { doc: Document; section: Element }) {
  const title =
    textOf(directChildren(section, 'title')[0]) ||
    attr(directChildren(section, 'code')[0], 'displayName');

  const organizers = findAll(section, 'organizer').filter(
    (organizer) => !insideNestedSection(organizer, section),
  );

  const groupedObservations = new Set<Element>();
  const groups: Array<{ label: string; rows: Row[] }> = [];

  for (const organizer of organizers) {
    const observations = findAll(organizer, 'observation').filter(
      (observation) => !insideNestedSection(observation, section),
    );

    if (observations.length === 0) continue;

    observations.forEach((observation) => groupedObservations.add(observation));

    groups.push({
      label: labelFromCode(doc, findFirst(organizer, 'code')).label,
      rows: observations.map((observation) => observationRow(doc, observation)),
    });
  }

  const standaloneObservations = findAll(section, 'observation').filter(
    (observation) =>
      !insideNestedSection(observation, section) && !groupedObservations.has(observation),
  );

  const acts = findAll(section, 'act').filter(
    (act) =>
      !insideNestedSection(act, section) &&
      findAll(act, 'observation').length === 0,
  );

  const procedures = findAll(section, 'procedure').filter(
    (procedure) => !insideNestedSection(procedure, section),
  );

  const looseRows = [
    ...standaloneObservations.map((observation) => observationRow(doc, observation)),
    ...acts.map((act) => entryRow(doc, act)),
    ...procedures.map((procedure) => entryRow(doc, procedure)),
  ];

  if (looseRows.length > 0) groups.push({ label: '', rows: looseRows });

  const nestedSections = directChildren(section, 'component')
    .map((component) => directChildren(component, 'section')[0])
    .filter((nested): nested is Element => Boolean(nested));

  const narrative = groups.length === 0 ? textOf(findFirst(section, 'text')) : '';
  const allRows = groups.flatMap((group) => group.rows);

  return (
    <div style={sectionCardStyle}>
      <h4 style={sectionHeaderStyle}>{title || 'Section'}</h4>

      {groups.map((group, groupIndex) => (
        <div key={`group-${groupIndex}`} style={{ marginTop: groupIndex === 0 ? 0 : '12px' }}>
          {group.label && <div style={groupHeadingStyle}>{group.label}</div>}
          <ResultsTable rows={group.rows} />
        </div>
      ))}

      {narrative && <p style={narrativeStyle}>{narrative}</p>}

      {allRows.length === 0 && !narrative && (
        <p style={emptyStyle}>No structured content in this section.</p>
      )}

      {nestedSections.map((nested, index) => (
        <CdaSectionView key={`nested-${index}`} doc={doc} section={nested} />
      ))}
    </div>
  );
}

function ResultsTable({ rows }: { rows: Row[] }) {
  const hasDate = rows.some((row) => row.date);
  const hasValue = rows.some((row) => row.value || row.unit);
  const hasRange = rows.some((row) => row.range);
  const hasInterpretation = rows.some((row) => row.interpretation || row.interpretationCode);
  const hasStatus = rows.some((row) => row.status);

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={headerCellStyle}>Item</th>
            {hasDate && <th style={headerCellStyle}>Date</th>}
            {hasValue && <th style={headerCellStyle}>Value</th>}
            {hasRange && <th style={headerCellStyle}>Reference range</th>}
            {hasInterpretation && <th style={headerCellStyle}>Interpretation</th>}
            {hasStatus && <th style={headerCellStyle}>Status</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} style={{ background: rowBackground(row) }}>
              <td style={cellStyle}>
                <div>{row.item}</div>
                {row.secondary && <div style={secondaryStyle}>{row.secondary}</div>}
              </td>
              {hasDate && <td style={cellStyle}>{row.date || '—'}</td>}
              {hasValue && (
                <td style={cellStyle}>
                  {row.value || '—'}
                  {row.unit && <span style={unitStyle}> {row.unit}</span>}
                </td>
              )}
              {hasRange && <td style={cellStyle}>{row.range || '—'}</td>}
              {hasInterpretation && (
                <td style={cellStyle}>{row.interpretation || row.interpretationCode || '—'}</td>
              )}
              {hasStatus && <td style={cellStyle}>{row.status || '—'}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const sectionCardStyle: CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '6px',
  padding: '12px 16px',
  marginTop: '12px',
};

const sectionHeaderStyle: CSSProperties = {
  margin: '0 0 8px 0',
  fontSize: '14px',
  color: '#0f172a',
  borderBottom: '1px solid #f1f5f9',
  paddingBottom: '4px',
};

const groupHeadingStyle: CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: '#0369a1',
  marginBottom: '4px',
};

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '13px',
  color: '#334155',
};

const headerCellStyle: CSSProperties = {
  textAlign: 'left',
  padding: '6px 8px',
  background: '#f8fafc',
  borderBottom: '1px solid #e2e8f0',
  fontWeight: 600,
  whiteSpace: 'nowrap',
};

const cellStyle: CSSProperties = {
  padding: '6px 8px',
  borderBottom: '1px solid #f1f5f9',
  verticalAlign: 'top',
};

const secondaryStyle: CSSProperties = {
  fontSize: '11px',
  color: '#64748b',
  marginTop: '2px',
};

const unitStyle: CSSProperties = {
  color: '#64748b',
};

const narrativeStyle: CSSProperties = {
  margin: 0,
  fontSize: '13px',
  color: '#475569',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
};

const emptyStyle: CSSProperties = {
  margin: 0,
  fontSize: '13px',
  color: '#64748b',
};

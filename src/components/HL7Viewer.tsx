// import { useRef, useState } from 'react';
// import type { ChangeEvent } from 'react';

// type Hl7Segment = {
//   name: string;
//   fields: string[];
// };

// const segmentTitles: Record<string, string> = {
//   MSH: 'Message Header (MSH)',
//   EVN: 'Event Type (EVN)',
//   PID: 'Patient Identification (PID)',
//   PV1: 'Patient Visit (PV1)',
//   PV2: 'Patient Visit Supplemental (PV2)',
// };

// export function HL7Viewer() {
//   const [parsedSegments, setParsedSegments] = useState<Hl7Segment[] | null>(null);
//   const [fileName, setFileName] = useState<string | null>(null);
//   const [error, setError] = useState<string | null>(null);
//   const inputRef = useRef<HTMLInputElement>(null);

//   const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (!file) return;

//     setFileName(file.name);

//     const reader = new FileReader();

//     reader.onload = (e) => {
//       const text = e.target?.result;
//       if (typeof text !== 'string') {
//         setParsedSegments(null);
//         setError('Could not read the selected file.');
//         return;
//       }

//       const lines = text.split(/\r\n|\n|\r/).filter(Boolean);

//       if (lines.length === 0) {
//         setParsedSegments(null);
//         setError('The selected file is empty.');
//         return;
//       }

//       const segments: Hl7Segment[] = lines.map((line) => {
//         const fields = line.split('|');
//         return {
//           name: fields[0] ?? '',
//           fields,
//         };
//       });

//       setError(null);
//       setParsedSegments(segments);
//     };

//     reader.onerror = () => {
//       setParsedSegments(null);
//       setError('Could not read the selected file.');
//     };

//     reader.readAsText(file);

//     // Reset the input so that re-selecting the same file fires `onChange` again.
//     if (inputRef.current) {
//       inputRef.current.value = '';
//     }
//   };

//   const handleClear = () => {
//     setParsedSegments(null);
//     setFileName(null);
//     setError(null);
//   };

//   // Helper function to map segment fields to human-readable structured details
//   const renderReadableSegment = (seg: Hl7Segment) => {
//     switch (seg.name) {
//       case 'MSH':
//         return (
//           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '14px' }}>
//             <div><strong>Sending Application:</strong> {seg.fields[2]?.split('^')[0]}</div>
//             <div><strong>Sending Facility:</strong> {seg.fields[3]?.split('^')[0]}</div>
//             <div><strong>Receiving Facility:</strong> {seg.fields[5]?.split('^')[0]}</div>
//             <div><strong>Message Timestamp:</strong> {seg.fields[6]}</div>
//             <div><strong>Message Type:</strong> {seg.fields[8]}</div>
//             <div><strong>Control ID:</strong> {seg.fields[9]}</div>
//             <div><strong>Processing ID:</strong> {seg.fields[10]}</div>
//             <div><strong>HL7 Version:</strong> {seg.fields[11]}</div>
//           </div>
//         );

//       case 'EVN':
//         return (
//           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '14px' }}>
//             <div><strong>Recorded Event:</strong> {seg.fields[1]}</div>
//             <div><strong>Event Timestamp:</strong> {seg.fields[2]}</div>
//           </div>
//         );

//       case 'PID': {
//         const nameEn = seg.fields[5]?.split('^') || [];
//         const nameAr = seg.fields[9]?.split('^') || [];
//         return (
//           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '14px' }}>
//             <div><strong>National ID / Identifier:</strong> {seg.fields[3]?.split('^')[0]}</div>
//             <div><strong>Date of Birth:</strong> {seg.fields[7]}</div>
//             <div><strong>Patient Name (English):</strong> {`${nameEn[0] || ''}, ${nameEn[1] || ''} ${nameEn[2] || ''}`}</div>
//             <div><strong>Patient Name (Arabic):</strong> {`${nameAr[0] || ''}, ${nameAr[1] || ''} ${nameAr[2] || ''}`}</div>
//             <div><strong>Gender:</strong> {seg.fields[8]}</div>
//             <div><strong>Nationality:</strong> {seg.fields[19] || seg.fields[22]}</div>
//             <div><strong>Marital Status:</strong> {seg.fields[16]}</div>
//             <div><strong>Death Indicator:</strong> {seg.fields[20] || seg.fields[23]}</div>
//           </div>
//         );
//       }

//       case 'PV1': {
//         const doctor = seg.fields[9]?.split('^') || [];
//         return (
//           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '14px' }}>
//             <div><strong>Patient Class:</strong> {seg.fields[2]}</div>
//             <div><strong>Admission Type:</strong> {seg.fields[4]}</div>
//             <div><strong>Visit / Encounter Number:</strong> {seg.fields[19]?.split('^')[0]}</div>
//             <div><strong>Admit Date/Time:</strong> {seg.fields[44]}</div>
//             <div style={{ gridColumn: 'span 2' }}>
//               <strong>Attending Physician:</strong> {doctor[1] ? `Dr. ${doctor[2]} ${doctor[1]} (ID: ${doctor[0]})` : 'N/A'}
//             </div>
//           </div>
//         );
//       }

//       case 'PV2':
//         return (
//           <div style={{ fontSize: '14px' }}>
//             <div><strong>Visit Control ID:</strong> {seg.fields[1]}</div>
//           </div>
//         );

//       default:
//         return (
//           <div style={{ fontSize: '13px', color: '#666' }}>
//             Raw Data: {seg.fields.slice(1).join(' | ')}
//           </div>
//         );
//     }
//   };

//   return (
//     <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
//       <h3>Human-Readable Healthcare HL7 v2 Viewer</h3>

//       <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
//         <input
//           ref={inputRef}
//           type="file"
//           accept=".hl7,.txt"
//           onChange={handleFileUpload}
//         />
//         {parsedSegments && (
//           <button type="button" onClick={handleClear}>
//             Clear
//           </button>
//         )}
//       </div>

//       {fileName && (
//         <p style={{ color: '#64748b', marginTop: 0 }}>
//           Loaded: <strong>{fileName}</strong>
//         </p>
//       )}

//       {error && (
//         <p role="alert" style={{ color: '#b91c1c', marginTop: 0 }}>
//           {error}
//         </p>
//       )}

//       <div>
//         {parsedSegments && parsedSegments.map((seg, index) => (
//           <div
//             key={index}
//             style={{
//               marginBottom: '15px',
//               border: '1px solid #cbd5e1',
//               padding: '15px',
//               borderRadius: '8px',
//               background: '#f8fafc',
//               boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
//             }}
//           >
//             <h4 style={{ margin: '0 0 12px 0', color: '#0284c7', borderBottom: '2px solid #e2e8f0', paddingBottom: '6px' }}>
//               {segmentTitles[seg.name] || `${seg.name} Segment`}
//             </h4>
//             {renderReadableSegment(seg)}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }
import React, { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';

type Hl7V2Segment = {
  name: string;
  fields: string[];
};

type CdaTextBlock =
  | { type: 'paragraph'; text: string; bold?: boolean }
  | { type: 'list'; items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] };

type CdaObservation = {
  name: string;
  value: string;
  date: string;
  status: string;
  details: string;
};

type CdaSection = {
  title: string;
  blocks: CdaTextBlock[];
  observations: CdaObservation[];
  subsections: CdaSection[];
};

type ParsedCdaData = {
  title: string;
  status: string;
  effectiveTime: string;
  patient: {
    name: string;
    id: string;
    dob: string;
    gender: string;
    nationality: string;
    phone: string;
  };
  encounter: {
    id: string;
    class: string;
    startTime: string;
    facility: string;
  };
  sections: CdaSection[];
};

type HL7ViewerProps = {
  /** When set, the viewer renders this content instead of its own upload control. */
  content?: string;
  /** File name to display when a parent component supplies the content. */
  fileName?: string;
};

function localNameOf(element: Element): string {
  return (element.localName || element.nodeName.replace(/^.*:/, '')).toLowerCase();
}

function normalizeNarrativeText(value: string | null | undefined): string {
  if (!value) return '';

  return value
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\r?\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function directChild(element: Element, name: string): Element | null {
  const target = name.toLowerCase();
  return Array.from(element.children).find((child) => localNameOf(child) === target) ?? null;
}

function directChildren(element: Element, name: string): Element[] {
  const target = name.toLowerCase();
  return Array.from(element.children).filter((child) => localNameOf(child) === target);
}

function buildNarrativeIdMap(xmlDoc: Document): Map<string, string> {
  const idMap = new Map<string, string>();

  xmlDoc.querySelectorAll('text').forEach((textElement) => {
    textElement.querySelectorAll('[ID], [id]').forEach((element) => {
      const id = element.getAttribute('ID') ?? element.getAttribute('id');
      if (!id) return;

      const text = normalizeNarrativeText(element.textContent);
      if (text) {
        idMap.set(id, text);
      }
    });
  });

  return idMap;
}

function resolveNarrativeReference(
  reference: Element | null,
  idMap: Map<string, string>,
): string {
  const value = reference?.getAttribute('value')?.trim() ?? '';
  if (!value) return '';
  if (!value.startsWith('#')) return value;
  return idMap.get(value.slice(1)) ?? '';
}

function readTableRow(row: Element): string[] {
  return Array.from(row.children)
    .filter((cell) => ['th', 'td'].includes(localNameOf(cell)))
    .map((cell) => normalizeNarrativeText(cell.textContent));
}

function parseNarrativeTable(tableElement: Element): CdaTextBlock | null {
  const rows: Element[] = [];

  Array.from(tableElement.children).forEach((child) => {
    const name = localNameOf(child);

    if (name === 'tr') {
      rows.push(child);
      return;
    }

    if (name === 'thead' || name === 'tbody' || name === 'tfoot') {
      Array.from(child.children).forEach((row) => {
        if (localNameOf(row) === 'tr') {
          rows.push(row);
        }
      });
    }
  });

  if (rows.length === 0) return null;

  const headerRow = rows.find((row) => directChildren(row, 'th').length > 0) ?? null;
  const headers = headerRow ? readTableRow(headerRow) : [];
  const bodyRows = rows
    .filter((row) => row !== headerRow)
    .map(readTableRow)
    .filter((cells) => cells.some(Boolean));

  if (headers.length === 0 && bodyRows.length === 0) return null;

  return { type: 'table', headers, rows: bodyRows };
}

function parseNarrativeBlocks(
  textElement: Element | null,
  idMap: Map<string, string>,
): CdaTextBlock[] {
  if (!textElement) return [];

  const blocks: CdaTextBlock[] = [];
  let buffer = '';

  const flush = () => {
    const text = normalizeNarrativeText(buffer);
    if (text) {
      blocks.push({ type: 'paragraph', text });
    }
    buffer = '';
  };

  Array.from(textElement.childNodes).forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      buffer += node.textContent ?? '';
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const element = node as Element;
    const name = localNameOf(element);

    if (name === 'paragraph') {
      flush();
      const text = normalizeNarrativeText(element.textContent);
      if (text) {
        const bold = (element.getAttribute('styleCode') ?? '').toLowerCase().includes('bold');
        blocks.push({ type: 'paragraph', text, bold });
      }
      return;
    }

    if (name === 'list') {
      flush();
      const items = directChildren(element, 'item')
        .map((item) => normalizeNarrativeText(item.textContent))
        .filter(Boolean);

      if (items.length > 0) {
        blocks.push({ type: 'list', items });
      }
      return;
    }

    if (name === 'table') {
      flush();
      const table = parseNarrativeTable(element);
      if (table) {
        blocks.push(table);
      }
      return;
    }

    if (name === 'br') {
      buffer += '\n';
      return;
    }

    if (name === 'reference') {
      buffer += resolveNarrativeReference(element, idMap);
      return;
    }

    buffer += element.textContent ?? '';
  });

  flush();
  return blocks;
}

function readCodeLabel(element: Element | null, idMap: Map<string, string>): string {
  if (!element) return '';

  const displayName = element.getAttribute('displayName')?.trim();
  if (displayName) return displayName;

  const code = element.getAttribute('code')?.trim();
  if (code) return code;

  const reference = element.querySelector('originalText reference');
  return resolveNarrativeReference(reference, idMap);
}

function readValue(element: Element | null, idMap: Map<string, string>): string {
  if (!element) return '';

  const value = element.getAttribute('value')?.trim();
  if (value) {
    const unit = element.getAttribute('unit')?.trim();
    return unit ? `${value} ${unit}` : value;
  }

  const displayName = element.getAttribute('displayName')?.trim();
  if (displayName) return displayName;

  const code = element.getAttribute('code')?.trim();
  if (code) return code;

  const reference = element.querySelector('reference');
  if (reference) {
    const resolved = resolveNarrativeReference(reference, idMap);
    if (resolved) return resolved;
  }

  return normalizeNarrativeText(element.textContent);
}

function readObservationStatus(observation: Element): string {
  const nphiesStatus = directChild(observation, 'observationStatus');
  const displayName = nphiesStatus?.getAttribute('displayName')?.trim();
  if (displayName) return displayName;

  return directChild(observation, 'statusCode')?.getAttribute('code')?.trim() ?? '';
}

function readInterpretation(observation: Element, idMap: Map<string, string>): string {
  const interpretationCode = directChild(observation, 'interpretationCode');
  if (!interpretationCode) return '';

  const displayName = interpretationCode.getAttribute('displayName')?.trim();
  if (displayName) return displayName;

  const code = interpretationCode.getAttribute('code')?.trim();
  if (code) return code;

  return resolveNarrativeReference(
    interpretationCode.querySelector('originalText reference'),
    idMap,
  );
}

function readReferenceRange(observation: Element, idMap: Map<string, string>): string {
  const referenceRange = directChild(observation, 'referenceRange');
  const observationRange = referenceRange
    ? directChild(referenceRange, 'observationRange')
    : null;

  if (!observationRange) return '';

  const parts: string[] = [];
  const textElement = directChild(observationRange, 'text');

  if (textElement) {
    const text =
      normalizeNarrativeText(textElement.textContent) ||
      resolveNarrativeReference(textElement.querySelector('reference'), idMap);

    if (text) {
      parts.push(text);
    }
  }

  const rangeInterpretation = directChild(observationRange, 'interpretationCode')
    ?.getAttribute('displayName')
    ?.trim();

  if (rangeInterpretation) {
    parts.push(rangeInterpretation);
  }

  return parts.join(' — ');
}

function parseObservations(
  sectionElement: Element,
  idMap: Map<string, string>,
): CdaObservation[] {
  const observations: CdaObservation[] = [];
  const seen = new Set<Element>();

  directChildren(sectionElement, 'entry').forEach((entry) => {
    entry.querySelectorAll('observation').forEach((observation) => {
      if (seen.has(observation)) return;
      seen.add(observation);

      const name = readCodeLabel(directChild(observation, 'code'), idMap) || 'Observation';
      const value = readValue(directChild(observation, 'value'), idMap);
      const date = directChild(observation, 'effectiveTime')?.getAttribute('value')?.trim() ?? '';
      const status = readObservationStatus(observation);
      const details = [
        readReferenceRange(observation, idMap),
        readInterpretation(observation, idMap),
      ]
        .filter(Boolean)
        .join(' — ');

      observations.push({ name, value, date, status, details });
    });
  });

  return observations;
}

function childSections(element: Element): Element[] {
  const directSections = directChildren(element, 'section');
  const componentSections = directChildren(element, 'component').flatMap((component) =>
    directChildren(component, 'section'),
  );

  return [...directSections, ...componentSections];
}

function parseSection(sectionElement: Element, idMap: Map<string, string>): CdaSection {
  const title =
    normalizeNarrativeText(directChild(sectionElement, 'title')?.textContent) ||
    readCodeLabel(directChild(sectionElement, 'code'), idMap) ||
    'Clinical Section';

  return {
    title,
    blocks: parseNarrativeBlocks(directChild(sectionElement, 'text'), idMap),
    observations: parseObservations(sectionElement, idMap),
    subsections: childSections(sectionElement).map((child) => parseSection(child, idMap)),
  };
}

function parseSections(xmlDoc: Document, idMap: Map<string, string>): CdaSection[] {
  const structuredBody = xmlDoc.querySelector('structuredBody');
  if (!structuredBody) return [];

  return directChildren(structuredBody, 'component')
    .flatMap((component) => directChildren(component, 'section'))
    .map((section) => parseSection(section, idMap));
}

// ---------------------------------------------------------------------------
// HL7 v2 helpers
// ---------------------------------------------------------------------------

type Hl7V2Group = {
  name: string;
  segments: Hl7V2Segment[];
};

const hl7EscapeSequences: Record<string, string> = {
  F: '|',
  S: '^',
  T: '&',
  R: '~',
  E: '\\',
  '.br': '\n',
};

const patientClassLabels: Record<string, string> = {
  I: 'Inpatient',
  O: 'Outpatient',
  E: 'Emergency',
  P: 'Pre-admit',
  R: 'Recurring patient',
  B: 'Obstetrics',
  C: 'Commercial account',
  N: 'Not applicable',
  U: 'Unknown',
};

const patientSexLabels: Record<string, string> = {
  M: 'Male',
  F: 'Female',
  O: 'Other',
  U: 'Unknown',
  A: 'Ambiguous',
  N: 'Not applicable',
};

const maritalStatusLabels: Record<string, string> = {
  S: 'Single',
  M: 'Married',
  D: 'Divorced',
  W: 'Widowed',
  A: 'Separated',
  N: 'Not married',
  U: 'Unknown',
};

const eventTypeLabels: Record<string, string> = {
  A01: 'Admit / visit notification',
  A02: 'Transfer a patient',
  A03: 'Discharge / end visit',
  A04: 'Register a patient',
  A05: 'Pre-admit a patient',
  A08: 'Update patient information',
  A11: 'Cancel admit / visit notification',
  A12: 'Cancel transfer',
  A13: 'Cancel discharge / end visit',
  A14: 'Pending admit',
  A28: 'Add person information',
  A31: 'Update person information',
  A40: 'Merge patient - patient identifier list',
  A45: 'Move visit information - visit number',
  A47: 'Change patient identifier list',
};

const diagnosisTypeLabels: Record<string, string> = {
  A: 'Admitting',
  W: 'Working',
  F: 'Final',
  D: 'Deleted',
};

const diagnosisActionLabels: Record<string, string> = {
  A: 'Add',
  D: 'Delete',
  U: 'Update',
};

const processingIdLabels: Record<string, string> = {
  P: 'Production',
  T: 'Training',
  D: 'Debugging',
};

const identifierTypeLabels: Record<string, string> = {
  NI: 'National ID',
  MR: 'Medical record number',
  PI: 'Patient internal identifier',
  PN: 'Person number',
  SS: 'Social security number',
  DL: 'Driver license number',
  PP: 'Passport number',
  PRN: 'Provider number',
  VN: 'Visit number',
};

const admitSourceLabels: Record<string, string> = {
  '1': 'Physician referral',
  '2': 'Clinic referral',
  '3': 'HMO referral',
  '4': 'Transfer from a hospital',
  '5': 'Transfer from a skilled nursing facility',
  '6': 'Transfer from another health care facility',
  '7': 'Emergency room',
  '8': 'Court / law enforcement',
  '9': 'Information not available',
};

const dischargeDispositionLabels: Record<string, string> = {
  '01': 'Discharged to home',
  '02': 'Transferred to another short term hospital',
  '03': 'Transferred to a skilled nursing facility',
  '04': 'Transferred to an intermediate care facility',
  '05': 'Transferred to another type of institution',
  '06': 'Transferred to home under a home health service',
  '07': 'Left against medical advice',
  '20': 'Expired',
  '21': 'Expired in a medical facility',
  '30': 'Still a patient',
  '40': 'Expired at home',
  '41': 'Expired in a medical facility',
  '42': 'Expired — place unknown',
  '50': 'Hospice — home',
  '51': 'Hospice — medical facility',
};

/**
 * Fields already surfaced in a segment's dedicated layout. Anything else in
 * that segment is offered through the "Additional fields" disclosure so that
 * vendor-specific values are never silently dropped.
 */
const handledSegmentFields: Record<string, number[]> = {
  MSH: [3, 4, 5, 6, 7, 9, 10, 11, 12, 15, 16, 17],
  EVN: [1, 2, 3, 4, 5, 6, 7],
  PID: [1, 2, 3, 4, 5, 7, 8, 9, 11, 13, 16, 22, 23, 28, 29, 30],
  PV1: [1, 2, 3, 4, 5, 7, 8, 9, 10, 14, 16, 17, 18, 19, 20, 36, 44, 45],
  PV2: [1],
  DG1: [1, 3, 4, 5, 6, 15, 16, 20, 21],
  AL1: [1, 2, 3, 4, 5, 6],
};

/** Segments whose content (tables, many columns) needs the full card width. */
const fullWidthSegmentNames = new Set(['PID', 'PV1', 'DG1', 'AL1', 'IN1', 'NK1']);

function decodeHl7Escapes(value: string): string {
  if (!value.includes('\\')) return value;

  return value.replace(/\\([^\\]{1,4})\\/g, (match, code: string) => {
    return hl7EscapeSequences[code] ?? match;
  });
}

/** Reads a field by HL7 field number. MSH-1 is the separator and is never stored. */
function hl7Field(segment: Hl7V2Segment, fieldNumber: number): string {
  // MSH keeps its encoding characters in the first stored field, so every
  // MSH field sits one slot earlier than the equivalent field in other segments.
  const index = segment.name === 'MSH' ? fieldNumber - 1 : fieldNumber;
  return decodeHl7Escapes(segment.fields[index] ?? '').trim();
}

function hl7Components(segment: Hl7V2Segment, fieldNumber: number): string[] {
  return hl7Field(segment, fieldNumber)
    .split('^')
    .map((component) => component.trim());
}

function firstComponent(value: string): string {
  return value.split('^')[0]?.trim() ?? '';
}

function formatCodedValue(value: string): string {
  const [code, text] = value.split('^').map((part) => part.trim());

  if (code && text) return `${code} — ${text}`;
  return text || code || '';
}

/** Formats an identifier (CX/PLN style) without exposing raw component separators. */
function formatIdentifier(value: string): string {
  const parts = value.split('^').map((part) => part.trim());
  const id = parts[0];

  if (!id) return '';

  const assigningAuthority = parts[3]?.split('&')[0]?.trim();
  const type = parts[4]?.trim();
  const typeLabel = type ? identifierTypeLabels[type.toUpperCase()] : undefined;
  const suffix = [
    typeLabel ? `${type} — ${typeLabel}` : type,
    assigningAuthority,
  ].filter(Boolean);

  return suffix.length > 0 ? `${id} (${suffix.join(' · ')})` : id;
}

/** Returns the event code (A01, A02, …) declared by the message header. */
function messageEventCode(segments: Hl7V2Segment[]): string {
  const msh = segments.find((segment) => segment.name === 'MSH');
  const event = msh ? hl7Components(msh, 9)[1] : '';

  if (event) return event;

  const evn = segments.find((segment) => segment.name === 'EVN');
  return evn ? hl7Field(evn, 1) : '';
}

function describeEvent(eventCode: string): string {
  if (!eventCode) return '';

  const label = eventTypeLabels[eventCode.toUpperCase()];
  return label ? `${eventCode} — ${label}` : eventCode;
}

/** PV1-45 means different things depending on which ADT event is being sent. */
function dischargeDateTimeLabel(eventCode: string): string {
  switch (eventCode.toUpperCase()) {
    case 'A11':
      return 'Cancel Admit Date/Time';
    case 'A12':
      return 'Cancel Transfer Date/Time';
    case 'A13':
      return 'Cancel Discharge Date/Time';
    default:
      return 'Discharge Date/Time';
  }
}

function formatHl7Timestamp(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  // Already formatted (e.g. an ISO date supplied by an upstream system).
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed;

  const match =
    /^(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?(?:\.\d+)?(?:([+-])(\d{2})(\d{2}))?/.exec(
      trimmed,
    );

  if (!match) return trimmed;

  const [, year, month, day, hour, minute, second, sign, offsetHour, offsetMinute] = match;

  if (!month) return year;

  const datePart = day ? `${year}-${month}-${day}` : `${year}-${month}`;
  if (!hour) return datePart;

  const timePart = [hour, minute, second].filter(Boolean).join(':');
  const offset = sign && offsetHour ? ` ${sign}${offsetHour}:${offsetMinute ?? '00'}` : '';

  return `${datePart} ${timePart}${offset}`;
}

function formatPersonName(value: string): string {
  const [family, given, middle] = value.split('^').map((part) => part.trim());
  const givenNames = [given, middle].filter(Boolean).join(' ');

  if (family && givenNames) return `${family}, ${givenNames}`;
  return family || givenNames;
}

function formatProviderName(value: string): string {
  // XCN: 1 id, 2 family, 3 given, 4 second name, 5 suffix, 6 prefix, 7 degree.
  const [, family, given, middle, , prefix] = value.split('^').map((part) => part.trim());
  const name = [given, middle, family].filter(Boolean).join(' ');
  const title =
    prefix && /^(dr|prof)$/i.test(prefix)
      ? `${prefix.charAt(0).toUpperCase()}${prefix.slice(1).toLowerCase()}.`
      : '';

  return name ? `${title} ${name}`.trim() : '';
}

function formatAddress(value: string): string {
  const parts = value.split('^').map((part) => part.trim());
  const street = parts[0];
  const city = parts[2];
  const state = parts[3];
  const country = parts[5];

  return [street, city, state, country].filter(Boolean).join(', ');
}

function formatLocation(value: string): string {
  const parts = value.split('^').map((part) => part.trim());
  const unit = [parts[0], parts[1], parts[2]].filter(Boolean).join(' / ');
  const facility = parts[3];
  const description = parts[8];

  return [description, unit, facility].filter(Boolean).join(' — ');
}

function describeCode(code: string, labels: Record<string, string>): string {
  if (!code) return '';

  const label = labels[code.toUpperCase()];
  return label ? `${code} — ${label}` : code;
}

function formatMessageType(value: string): string {
  const [code, event] = value.split('^').map((part) => part.trim());

  if (!code) return '';

  const base = event ? `${code}^${event}` : code;
  const label = event ? eventTypeLabels[event.toUpperCase()] : undefined;

  return label ? `${base} — ${label}` : base;
}

/** Groups consecutive segments of the same type while preserving message order. */
function groupSegments(segments: Hl7V2Segment[]): Hl7V2Group[] {
  return segments.reduce<Hl7V2Group[]>((groups, segment) => {
    const current = groups[groups.length - 1];

    if (current && current.name === segment.name) {
      current.segments.push(segment);
    } else {
      groups.push({ name: segment.name, segments: [segment] });
    }

    return groups;
  }, []);
}

const segmentTitles: Record<string, string> = {
  MSH: 'Message Header (MSH)',
  EVN: 'Event Type (EVN)',
  PID: 'Patient Identification (PID)',
  PV1: 'Patient Visit (PV1)',
  PV2: 'Patient Visit Supplemental (PV2)',
  AL1: 'Allergy (AL1)',
  DG1: 'Diagnosis (DG1)',
  NK1: 'Next of Kin (NK1)',
  IN1: 'Insurance (IN1)',
};

export function HL7Viewer({ content, fileName: providedFileName }: HL7ViewerProps = {}) {
  const [fileType, setFileType] = useState<'v2' | 'v3' | null>(null);
  const [v2Segments, setV2Segments] = useState<Hl7V2Segment[] | null>(null);
  const [v3Data, setV3Data] = useState<ParsedCdaData | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isEmbedded = content !== undefined;
  const displayedFileName = isEmbedded ? providedFileName ?? null : fileName;

  const processText = (text: string) => {
    const trimmedText = text.trim();

    // Detect if the file is HL7 v3 / CDA XML
    if (trimmedText.startsWith('<') || trimmedText.includes('<?xml')) {
      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(trimmedText, 'application/xml');

        const parserError = xmlDoc.querySelector('parsererror');
        if (parserError) {
          resetState();
          setError('Invalid XML/HL7 v3 file format.');
          return;
        }

        const parsed = parseCdaXml(xmlDoc);
        setFileType('v3');
        setV3Data(parsed);
        setV2Segments(null);
        setError(null);
      } catch {
        resetState();
        setError('Failed to parse HL7 v3 XML document.');
      }
    } else {
      // Handle HL7 v2 pipe-delimited file
      const lines = trimmedText.split(/\r\n|\n|\r/).filter(Boolean);
      if (lines.length === 0) {
        resetState();
        setError('The selected file is empty.');
        return;
      }

      const segments: Hl7V2Segment[] = lines.map((line) => {
        const fields = line.split('|');
        return {
          name: fields[0] ?? '',
          fields,
        };
      });

      setFileType('v2');
      setV2Segments(segments);
      setV3Data(null);
      setError(null);
    }
  };

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text !== 'string') {
        resetState();
        setError('Could not read the selected file.');
        return;
      }

      processText(text);
    };

    reader.onerror = () => {
      resetState();
      setError('Could not read the selected file.');
    };

    reader.readAsText(file);

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const resetState = () => {
    setFileType(null);
    setV2Segments(null);
    setV3Data(null);
    setFileName(null);
  };

  const handleClear = () => {
    resetState();
    setError(null);
  };

  // Helper to parse HL7 v3 CDA XML structures dynamically
  const parseCdaXml = (xmlDoc: Document): ParsedCdaData => {
    const getVal = (selector: string, attr?: string) => {
      const el = xmlDoc.querySelector(selector);
      if (!el) return 'N/A';
      return attr ? el.getAttribute(attr) || 'N/A' : el.textContent?.trim() || 'N/A';
    };

    // Patient info extraction
    const patientNameEl = xmlDoc.querySelector('patientRole patient name');
    const family = patientNameEl?.querySelector('family')?.textContent || '';
    const given = patientNameEl?.querySelector('given')?.textContent || '';
    const patientName = `${family}, ${given}`.trim() || 'N/A';

    const nationalId = xmlDoc.querySelector('patientRole id')?.getAttribute('extension') || 'N/A';
    const dob = xmlDoc.querySelector('patientTech birthTime, birthTime')?.getAttribute('value') || xmlDoc.querySelector('birthTime')?.getAttribute('value') || 'N/A';
    const gender = xmlDoc.querySelector('administrativeGenderCode')?.getAttribute('displayName') || 'N/A';
    const nationality = xmlDoc.querySelector('participant[typeCode="SBJ"] code')?.getAttribute('code') || 'N/A';
    const phone = xmlDoc.querySelector('patientRole telecom')?.getAttribute('value') || 'N/A';

    // Encounter info
    const encounterId = xmlDoc.querySelector('encompassingEncounter id')?.getAttribute('extension') || 'N/A';
    const encClass = xmlDoc.querySelector('encompassingEncounter code')?.getAttribute('displayName') || 'N/A';
    const encStart = xmlDoc.querySelector('encompassingEncounter effectiveTime low')?.getAttribute('value') || 'N/A';
    const facilityName = xmlDoc.querySelector('encompassingEncounter healthCareFacility serviceProviderOrganization name')?.textContent || 'N/A';

    // Sections extraction
    const narrativeIdMap = buildNarrativeIdMap(xmlDoc);
    const sections = parseSections(xmlDoc, narrativeIdMap);

    return {
      title: getVal('ClinicalDocument > title', ''),
      status: xmlDoc.querySelector('documentStatus')?.getAttribute('displayName') || getVal('documentStatus', 'code'),
      effectiveTime: getVal('ClinicalDocument > effectiveTime', 'value'),
      patient: { name: patientName, id: nationalId, dob, gender, nationality, phone },
      encounter: { id: encounterId, class: encClass, startTime: encStart, facility: facilityName },
      sections,
    };
  };

  // Keep the viewer in sync when a parent component supplies the content.
  useEffect(() => {
    if (content !== undefined) {
      processText(content);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  // Helpers for HL7 v2 segment rendering
  const renderDetailGrid = (items: Array<{ label: string; value: string }>) => {
    const visibleItems = items.filter((item) => item.value);

    if (visibleItems.length === 0) {
      return <p style={segmentEmptyStyle}>No data in this segment.</p>;
    }

    return (
      <div style={gridStyle}>
        {visibleItems.map((item, index) => (
          <div key={`${item.label}-${index}`}>
            <strong>{item.label}:</strong> {item.value}
          </div>
        ))}
      </div>
    );
  };

  const renderV2Table = (headers: string[], rows: string[][]) => (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '13px' }}>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header} style={tableHeaderStyle}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} style={tableCellStyle}>
                  {cell || '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderRawSegment = (segment: Hl7V2Segment) => (
    <details style={rawDetailsStyle}>
      <summary style={rawSummaryStyle}>Raw segment</summary>
      <pre style={rawPreStyle}>{segment.fields.join('|')}</pre>
    </details>
  );

  const renderMshSegment = (segment: Hl7V2Segment) =>
    renderDetailGrid([
      { label: 'Sending Application', value: firstComponent(hl7Field(segment, 3)) },
      { label: 'Sending Facility', value: firstComponent(hl7Field(segment, 4)) },
      { label: 'Receiving Application', value: firstComponent(hl7Field(segment, 5)) },
      { label: 'Receiving Facility', value: firstComponent(hl7Field(segment, 6)) },
      { label: 'Message Timestamp', value: formatHl7Timestamp(hl7Field(segment, 7)) },
      { label: 'Message Type', value: formatMessageType(hl7Field(segment, 9)) },
      { label: 'Control ID', value: hl7Field(segment, 10) },
      {
        label: 'Processing ID',
        value: describeCode(hl7Field(segment, 11), processingIdLabels),
      },
      { label: 'HL7 Version', value: hl7Field(segment, 12) },
      { label: 'Accept Ack Type', value: hl7Field(segment, 15) },
      { label: 'Application Ack Type', value: hl7Field(segment, 16) },
      { label: 'Country Code', value: hl7Field(segment, 17) },
    ]);

  const renderEvnSegment = (segment: Hl7V2Segment) =>
    renderDetailGrid([
      { label: 'Event Type', value: describeCode(hl7Field(segment, 1), eventTypeLabels) },
      { label: 'Recorded Date/Time', value: formatHl7Timestamp(hl7Field(segment, 2)) },
      { label: 'Planned Event ID', value: hl7Field(segment, 3) },
      { label: 'Event Reason', value: formatCodedValue(hl7Field(segment, 4)) },
      { label: 'Operator', value: formatProviderName(hl7Field(segment, 5)) },
      { label: 'Event Occurred', value: formatHl7Timestamp(hl7Field(segment, 6)) },
      { label: 'Event Facility', value: firstComponent(hl7Field(segment, 7)) },
    ]);

  const renderPidSegment = (segment: Hl7V2Segment) =>
    renderDetailGrid([
      { label: 'Patient ID', value: formatIdentifier(hl7Field(segment, 2)) },
      { label: 'National ID', value: formatIdentifier(hl7Field(segment, 3)) },
      { label: 'Alternate ID', value: formatIdentifier(hl7Field(segment, 4)) },
      { label: 'Patient Name (En)', value: formatPersonName(hl7Field(segment, 5)) },
      { label: 'Patient Name (Ar)', value: formatPersonName(hl7Field(segment, 9)) },
      { label: 'Date of Birth', value: formatHl7Timestamp(hl7Field(segment, 7)) },
      { label: 'Gender', value: describeCode(hl7Field(segment, 8), patientSexLabels) },
      {
        label: 'Marital Status',
        value: describeCode(hl7Field(segment, 16), maritalStatusLabels),
      },
      { label: 'Nationality', value: hl7Field(segment, 28) || hl7Field(segment, 26) },
      { label: 'Ethnic Group', value: formatCodedValue(hl7Field(segment, 22)) },
      { label: 'Birth Place', value: hl7Field(segment, 23) },
      { label: 'Address', value: formatAddress(hl7Field(segment, 11)) },
      { label: 'Phone', value: firstComponent(hl7Field(segment, 13)) },
      {
        label: 'Death Date/Time',
        value: formatHl7Timestamp(hl7Field(segment, 29)),
      },
      {
        label: 'Death Indicator',
        value: describeCode(hl7Field(segment, 30), { Y: 'Yes', N: 'No' }),
      },
    ]);

  const renderPv1Segment = (segment: Hl7V2Segment, eventCode: string) => {
    const attending = formatProviderName(hl7Field(segment, 7));
    const referring = formatProviderName(hl7Field(segment, 8));
    const consulting = formatProviderName(hl7Field(segment, 9));
    const admitting = formatProviderName(hl7Field(segment, 17));

    return renderDetailGrid([
      { label: 'Patient Class', value: describeCode(hl7Field(segment, 2), patientClassLabels) },
      { label: 'Admission Type', value: hl7Field(segment, 4) },
      { label: 'Assigned Location', value: formatLocation(hl7Field(segment, 3)) },
      { label: 'Hospital Service', value: hl7Field(segment, 10) },
      { label: 'Attending Physician', value: attending },
      { label: 'Referring Physician', value: referring === attending ? '' : referring },
      { label: 'Consulting Physician', value: consulting === attending ? '' : consulting },
      { label: 'Admitting Physician', value: admitting === attending ? '' : admitting },
      {
        label: 'Admit Source',
        value: describeCode(hl7Field(segment, 14), admitSourceLabels),
      },
      { label: 'Patient Type', value: hl7Field(segment, 18) },
      {
        label: 'VIP Indicator',
        value: describeCode(hl7Field(segment, 16), { Y: 'Yes', N: 'No' }),
      },
      { label: 'Visit Number', value: formatIdentifier(hl7Field(segment, 19)) },
      { label: 'Financial Class', value: formatCodedValue(hl7Field(segment, 20)) },
      {
        label: 'Discharge Disposition',
        value: describeCode(hl7Field(segment, 36), dischargeDispositionLabels),
      },
      { label: 'Admit Date/Time', value: formatHl7Timestamp(hl7Field(segment, 44)) },
      {
        label: dischargeDateTimeLabel(eventCode),
        value: formatHl7Timestamp(hl7Field(segment, 45)),
      },
    ]);
  };

  const renderPv2Segment = (segment: Hl7V2Segment) => {
    const items: Array<{ label: string; value: string }> = [
      { label: 'Visit / Reference ID', value: firstComponent(hl7Field(segment, 1)) },
    ];

    for (let fieldNumber = 2; fieldNumber < segment.fields.length; fieldNumber += 1) {
      items.push({ label: `PV2-${fieldNumber}`, value: hl7Field(segment, fieldNumber) });
    }

    return renderDetailGrid(items);
  };

  /** Surfaces segment fields that the dedicated layouts above do not show. */
  const renderAdditionalFields = (segment: Hl7V2Segment) => {
    const handled = new Set(handledSegmentFields[segment.name] ?? []);
    const rows = segment.fields
      .map((_, index) => {
        if (index === 0) return null;

        // MSH stores its encoding characters in slot 1, so stored index + 1 is
        // the HL7 field number. The separator and encoding characters add no
        // value on their own.
        const fieldNumber = segment.name === 'MSH' ? index + 1 : index;
        if (segment.name === 'MSH' && fieldNumber <= 2) return null;
        if (handled.has(fieldNumber)) return null;

        const value = hl7Field(segment, fieldNumber);
        if (!value) return null;

        const display = hl7Components(segment, fieldNumber).filter(Boolean).join(' · ');
        if (!display) return null;

        return [`${segment.name}-${fieldNumber}`, display];
      })
      .filter((row): row is string[] => row !== null);

    if (rows.length === 0) return null;

    return (
      <details style={rawDetailsStyle}>
        <summary style={rawSummaryStyle}>Additional fields ({rows.length})</summary>
        <div style={{ marginTop: '8px' }}>{renderV2Table(['Field', 'Value'], rows)}</div>
      </details>
    );
  };

  const renderAl1Group = (segments: Hl7V2Segment[]) =>
    renderV2Table(
      ['Allergen', 'Allergy Type', 'Severity', 'Reaction', 'Noted On'],
      segments.map((segment) => [
        formatCodedValue(hl7Field(segment, 3)),
        formatCodedValue(hl7Field(segment, 2)),
        formatCodedValue(hl7Field(segment, 4)),
        formatCodedValue(hl7Field(segment, 5)),
        formatHl7Timestamp(hl7Field(segment, 6)),
      ]),
    );

  const renderDg1Group = (segments: Hl7V2Segment[]) =>
    renderV2Table(
      ['Diagnosis', 'Type', 'Date', 'Action'],
      segments.map((segment) => {
        const coded = formatCodedValue(hl7Field(segment, 3));
        const description = hl7Field(segment, 4);

        return [
          coded && description ? `${coded} (${description})` : coded || description,
          describeCode(hl7Field(segment, 6), diagnosisTypeLabels),
          formatHl7Timestamp(hl7Field(segment, 5)),
          describeCode(hl7Field(segment, 20), diagnosisActionLabels),
        ];
      }),
    );

  const renderGenericSegment = (segment: Hl7V2Segment, index: number, showIndex: boolean) => {
    const rows = segment.fields
      .map((_, fieldNumber) => fieldNumber)
      .slice(1)
      .map((fieldNumber) => [
        `Field ${fieldNumber}`,
        hl7Components(segment, fieldNumber).filter(Boolean).join(' · '),
      ])
      .filter(([, value]) => Boolean(value));

    return (
      <div key={index} style={index > 0 && showIndex ? { marginTop: '16px' } : undefined}>
        {showIndex && <h5 style={subHeaderStyle}>Segment {index + 1}</h5>}
        {rows.length > 0 ? (
          renderV2Table(['Field', 'Value'], rows)
        ) : (
          <p style={segmentEmptyStyle}>No populated fields in this segment.</p>
        )}
        {renderRawSegment(segment)}
      </div>
    );
  };

  const renderV2Group = (group: Hl7V2Group, eventCode: string) => {
    const segment = group.segments[0];

    switch (group.name) {
      case 'MSH':
        return (
          <>
            {renderMshSegment(segment)}
            {renderAdditionalFields(segment)}
          </>
        );
      case 'EVN':
        return (
          <>
            {renderEvnSegment(segment)}
            {renderAdditionalFields(segment)}
          </>
        );
      case 'PID':
        return (
          <>
            {renderPidSegment(segment)}
            {renderAdditionalFields(segment)}
          </>
        );
      case 'PV1':
        return (
          <>
            {renderPv1Segment(segment, eventCode)}
            {renderAdditionalFields(segment)}
          </>
        );
      case 'PV2':
        return (
          <>
            {renderPv2Segment(segment)}
            {renderAdditionalFields(segment)}
          </>
        );
      case 'AL1':
        return (
          <>
            {renderAl1Group(group.segments)}
            {group.segments.map((item, index) => (
              <div key={index}>{renderAdditionalFields(item)}</div>
            ))}
          </>
        );
      case 'DG1':
        return (
          <>
            {renderDg1Group(group.segments)}
            {group.segments.map((item, index) => (
              <div key={index}>{renderAdditionalFields(item)}</div>
            ))}
          </>
        );
      default:
        return group.segments.map((item, index) =>
          renderGenericSegment(item, index, group.segments.length > 1),
        );
    }
  };

  const renderV2Overview = (segments: Hl7V2Segment[]) => {
    const msh = segments.find((segment) => segment.name === 'MSH');
    const evn = segments.find((segment) => segment.name === 'EVN');
    const pid = segments.find((segment) => segment.name === 'PID');
    const pv1 = segments.find((segment) => segment.name === 'PV1');
    const dg1 = segments.find((segment) => segment.name === 'DG1');
    const eventCode = messageEventCode(segments);

    const sender = msh
      ? [firstComponent(hl7Field(msh, 3)), firstComponent(hl7Field(msh, 4))]
          .filter(Boolean)
          .join(' — ')
      : '';
    const receiver = msh
      ? [firstComponent(hl7Field(msh, 5)), firstComponent(hl7Field(msh, 6))]
          .filter(Boolean)
          .join(' — ')
      : '';
    const patientName = pid ? formatPersonName(hl7Field(pid, 5)) : '';
    const patientId = pid ? formatIdentifier(hl7Field(pid, 3)) : '';
    const patient = [patientName, patientId ? `(${patientId})` : '']
      .filter(Boolean)
      .join(' ');
    const attending = pv1 ? formatProviderName(hl7Field(pv1, 7)) : '';
    const diagnosis = dg1 ? formatCodedValue(hl7Field(dg1, 3)) : '';

    return (
      <div style={{ ...cardStyle, gridColumn: 'span 2' }}>
        <h4 style={headerStyle}>Message Overview</h4>
        {renderDetailGrid([
          { label: 'Message Type', value: msh ? formatMessageType(hl7Field(msh, 9)) : '' },
          {
            label: 'Event',
            value: describeEvent(eventCode) || (evn ? describeCode(hl7Field(evn, 1), eventTypeLabels) : ''),
          },
          { label: 'Control ID', value: msh ? hl7Field(msh, 10) : '' },
          { label: 'Message Timestamp', value: msh ? formatHl7Timestamp(hl7Field(msh, 7)) : '' },
          {
            label: 'Event Recorded',
            value: evn ? formatHl7Timestamp(hl7Field(evn, 2)) : '',
          },
          {
            label: 'Event Occurred',
            value: evn ? formatHl7Timestamp(hl7Field(evn, 6)) : '',
          },
          { label: 'Sender', value: sender },
          { label: 'Receiver', value: receiver },
          {
            label: 'Processing ID',
            value: msh ? describeCode(hl7Field(msh, 11), processingIdLabels) : '',
          },
          { label: 'HL7 Version', value: msh ? hl7Field(msh, 12) : '' },
          { label: 'Patient', value: patient },
          {
            label: 'Patient Class',
            value: pv1 ? describeCode(hl7Field(pv1, 2), patientClassLabels) : '',
          },
          { label: 'Visit Number', value: pv1 ? formatIdentifier(hl7Field(pv1, 19)) : '' },
          { label: 'Attending Physician', value: attending },
          { label: 'Primary Diagnosis', value: diagnosis },
          {
            label: 'Segments',
            value: segments
              .map((segment) => segment.name)
              .filter((name, index, names) => names.indexOf(name) === index)
              .join(', '),
          },
        ])}

        <details style={rawDetailsStyle}>
          <summary style={rawSummaryStyle}>Raw HL7 message</summary>
          <pre style={rawPreStyle}>
            {segments.map((segment) => segment.fields.join('|')).join('\n')}
          </pre>
        </details>
      </div>
    );
  };

  const renderTextBlock = (block: CdaTextBlock, index: number) => {
    if (block.type === 'list') {
      return (
        <ul
          key={index}
          style={{ margin: '6px 0', paddingLeft: '22px', fontSize: '14px', color: '#334155' }}
        >
          {block.items.map((item, itemIndex) => (
            <li key={itemIndex} style={{ marginBottom: '2px' }}>
              {item}
            </li>
          ))}
        </ul>
      );
    }

    if (block.type === 'table') {
      return (
        <div key={index} style={{ overflowX: 'auto', margin: '10px 0' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '13px' }}>
            {block.headers.length > 0 && (
              <thead>
                <tr>
                  {block.headers.map((header, headerIndex) => (
                    <th key={headerIndex} style={tableHeaderStyle}>
                      {header || '—'}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} style={tableCellStyle}>
                      {cell || '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <p
        key={index}
        style={{
          margin: '6px 0',
          fontSize: '14px',
          color: '#334155',
          whiteSpace: 'pre-wrap',
          fontWeight: block.bold ? 700 : 400,
        }}
      >
        {block.text}
      </p>
    );
  };

  const renderObservations = (observations: CdaObservation[]) => {
    if (observations.length === 0) return null;

    return (
      <div style={{ marginTop: '14px' }}>
        <h5 style={{ margin: '0 0 8px 0', color: '#475569', fontSize: '14px' }}>
          Observations
        </h5>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '13px' }}>
            <thead>
              <tr>
                <th style={tableHeaderStyle}>Test</th>
                <th style={tableHeaderStyle}>Value</th>
                <th style={tableHeaderStyle}>Date</th>
                <th style={tableHeaderStyle}>Status</th>
                <th style={tableHeaderStyle}>Range / Interpretation</th>
              </tr>
            </thead>
            <tbody>
              {observations.map((observation, index) => (
                <tr key={index}>
                  <td style={tableCellStyle}>{observation.name || '—'}</td>
                  <td style={tableCellStyle}>{observation.value || '—'}</td>
                  <td style={tableCellStyle}>{observation.date || '—'}</td>
                  <td style={tableCellStyle}>{observation.status || '—'}</td>
                  <td style={tableCellStyle}>{observation.details || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderSection = (section: CdaSection, depth: number, index: number) => {
    const hasDirectContent = section.blocks.length > 0 || section.observations.length > 0;

    return (
      <div
        key={`${section.title}-${depth}-${index}`}
        style={{
          ...cardStyle,
          marginLeft: depth > 0 ? '16px' : 0,
          borderLeft: depth > 0 ? '3px solid #7dd3fc' : '1px solid #cbd5e1',
        }}
      >
        <h4 style={{ ...headerStyle, fontSize: depth > 0 ? '15px' : undefined }}>
          {section.title}
        </h4>

        {hasDirectContent ? (
          <>
            {section.blocks.map(renderTextBlock)}
            {renderObservations(section.observations)}
          </>
        ) : section.subsections.length === 0 ? (
          <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
            No narrative content in this section.
          </p>
        ) : null}

        {section.subsections.map((subsection, subsectionIndex) =>
          renderSection(subsection, depth + 1, subsectionIndex),
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: '20px' }}>

      {!isEmbedded && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <input
            ref={inputRef}
            type="file"
            accept=".hl7,.txt,.xml"
            onChange={handleFileUpload}
          />
          {(v2Segments || v3Data) && (
            <button type="button" onClick={handleClear} style={{ padding: '6px 12px', cursor: 'pointer' }}>
              Clear
            </button>
          )}
        </div>
      )}

      {displayedFileName && (
        <p style={{ color: '#64748b', marginTop: 0 }}>
          Loaded ({fileType?.toUpperCase() || 'UNKNOWN'}): <strong>{displayedFileName}</strong>
        </p>
      )}

      {error && (
        <p role="alert" style={{ color: '#b91c1c', marginTop: 0 }}>
          {error}
        </p>
      )}

      {/* RENDER HL7 v3 / CDA XML DATA */}
      {fileType === 'v3' && v3Data && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
          {/* Document Overview Card */}
          <div style={cardStyle}>
            <h4 style={headerStyle}>Clinical Document Overview</h4>
            <div style={gridStyle}>
              <div><strong>Title:</strong> {v3Data.title}</div>
              <div><strong>Status:</strong> {v3Data.status}</div>
              <div style={{ gridColumn: 'span 2' }}><strong>Effective Time:</strong> {v3Data.effectiveTime}</div>
            </div>
          </div>

          {/* Patient Card */}
          <div style={cardStyle}>
            <h4 style={headerStyle}>Patient Information</h4>
            <div style={gridStyle}>
              <div><strong>Name:</strong> {v3Data.patient.name}</div>
              <div><strong>National ID:</strong> {v3Data.patient.id}</div>
              <div><strong>Date of Birth:</strong> {v3Data.patient.dob}</div>
              <div><strong>Gender:</strong> {v3Data.patient.gender}</div>
              <div><strong>Nationality:</strong> {v3Data.patient.nationality}</div>
              <div><strong>Phone:</strong> {v3Data.patient.phone}</div>
            </div>
          </div>

          {/* Encounter Card */}
          <div style={cardStyle}>
            <h4 style={headerStyle}>Encounter Details</h4>
            <div style={gridStyle}>
              <div><strong>Encounter ID:</strong> {v3Data.encounter.id}</div>
              <div><strong>Class:</strong> {v3Data.encounter.class}</div>
              <div><strong>Facility:</strong> {v3Data.encounter.facility}</div>
              <div><strong>Start Time:</strong> {v3Data.encounter.startTime}</div>
            </div>
          </div>

          {/* Clinical Sections */}
          {v3Data.sections.map((section, index) => renderSection(section, 0, index))}
        </div>
      )}

      {/* RENDER HL7 v2 SEGMENTS */}
      {fileType === 'v2' && v2Segments && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
          {renderV2Overview(v2Segments)}
          {groupSegments(v2Segments).map((group, index) => (
            <div
              key={`${group.name}-${index}`}
              style={{
                ...cardStyle,
                gridColumn: fullWidthSegmentNames.has(group.name) ? 'span 2' : undefined,
              }}
            >
              <h4 style={headerStyle}>
                {segmentTitles[group.name] || `${group.name} Segment`}
                {group.segments.length > 1 ? ` — ${group.segments.length}` : ''}
              </h4>
              {renderV2Group(group, messageEventCode(v2Segments))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Shared Card Styling Constants
const cardStyle: React.CSSProperties = {
  marginBottom: '15px',
  border: '1px solid #cbd5e1',
  padding: '15px',
  borderRadius: '8px',
  background: '#f8fafc',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
};

const headerStyle: React.CSSProperties = {
  margin: '0 0 12px 0',
  color: '#0284c7',
  borderBottom: '2px solid #e2e8f0',
  paddingBottom: '6px',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '8px',
  fontSize: '14px',
};

const tableHeaderStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  background: '#e2e8f0',
  padding: '6px 8px',
  textAlign: 'left',
  color: '#0f172a',
  whiteSpace: 'nowrap',
};

const tableCellStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  padding: '6px 8px',
  verticalAlign: 'top',
  color: '#334155',
};

const segmentEmptyStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '14px',
  color: '#64748b',
};

const subHeaderStyle: React.CSSProperties = {
  margin: '0 0 8px 0',
  color: '#475569',
  fontSize: '13px',
};

const rawDetailsStyle: React.CSSProperties = {
  marginTop: '10px',
  fontSize: '12px',
  color: '#475569',
};

const rawSummaryStyle: React.CSSProperties = {
  cursor: 'pointer',
  color: '#0369a1',
};

const rawPreStyle: React.CSSProperties = {
  margin: '8px 0 0',
  padding: '8px',
  border: '1px solid #e2e8f0',
  borderRadius: '6px',
  background: '#ffffff',
  color: '#334155',
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
};
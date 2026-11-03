import type { CSSProperties } from 'react';
import {
  attr,
  directChildren,
  findAll,
  findFirst,
  formatHl7Date,
  readName,
  tagOf,
  textOf,
} from '../../lib/xml';
import { CdaSectionView } from './CdaSectionView';

type ProviderRow = {
  role: string;
  name: string;
  id: string;
  specialty: string;
  organization: string;
};

function direct(root: Element, tag: string): Element | null {
  return directChildren(root, tag)[0] ?? null;
}

function codeLabel(element: Element | null | undefined): string {
  return attr(element, 'displayName') || attr(element, 'code');
}

function joinParts(...parts: Array<string | null | undefined>): string {
  return parts
    .map((part) => part?.trim() ?? '')
    .filter(Boolean)
    .join(', ');
}

function hasSectionAncestor(element: Element, boundary: Element): boolean {
  let parent = element.parentElement;
  while (parent && parent !== boundary) {
    if (tagOf(parent) === 'section') return true;
    parent = parent.parentElement;
  }
  return false;
}

function collectSections(doc: Document): Element[] {
  const fromBodies = findAll(doc, 'structuredbody').flatMap((body) =>
    directChildren(body, 'component')
      .map((component) => directChildren(component, 'section')[0])
      .filter((section): section is Element => Boolean(section)),
  );

  if (fromBodies.length > 0) return fromBodies;

  const root = doc.documentElement;
  return findAll(doc, 'section').filter((section) => !hasSectionAncestor(section, root));
}

export function CdaDocumentView({ doc }: { doc: Document }) {
  const root = doc.documentElement;
  if (!root) return null;

  const recordTarget = findFirst(doc, 'recordtarget');
  const patientRole = findFirst(recordTarget, 'patientrole');
  const patient = findFirst(patientRole, 'patient');
  const patientName = readName(findFirst(patient, 'name')).full;
  const patientId =
    attr(findFirst(patientRole, 'id'), 'extension') || attr(findFirst(patientRole, 'id'), 'root');
  const gender = codeLabel(findFirst(patient, 'administrativegendercode'));
  const birthDateRaw = attr(findFirst(patient, 'birthtime'), 'value');
  const birthDate = birthDateRaw ? formatHl7Date(birthDateRaw) : 'N/A';
  const phone = attr(findFirst(patientRole, 'telecom'), 'value') || 'N/A';

  const addressElement = findFirst(patientRole, 'addr');
  const address = joinParts(
    textOf(findFirst(addressElement, 'streetaddressline')),
    textOf(findFirst(addressElement, 'city')),
    textOf(findFirst(addressElement, 'postalcode')),
    textOf(findFirst(addressElement, 'country')),
  );

  const subjectParticipant = findAll(doc, 'participant').find(
    (participant) => attr(participant, 'typeCode') === 'SBJ',
  );
  const nationality = codeLabel(
    findFirst(findFirst(subjectParticipant, 'associatedentity'), 'code'),
  );

  const encounter = findFirst(doc, 'encompassingencounter');
  const encounterId = attr(findFirst(encounter, 'id'), 'extension');
  const encounterType = codeLabel(findFirst(encounter, 'code'));
  const encounterLow = attr(findFirst(findFirst(encounter, 'effectivetime'), 'low'), 'value');
  const encounterHigh = attr(findFirst(findFirst(encounter, 'effectivetime'), 'high'), 'value');
  const encounterPeriod = joinParts(
    encounterLow ? formatHl7Date(encounterLow) : '',
    encounterHigh ? formatHl7Date(encounterHigh) : '',
  );
  const facilityElement = findFirst(encounter, 'healthcarefacility');
  const facility =
    textOf(findFirst(findFirst(facilityElement, 'serviceproviderorganization'), 'name')) ||
    textOf(findFirst(facilityElement, 'name'));

  const authorRows: ProviderRow[] = findAll(doc, 'author').map((author) => {
    const assigned = findFirst(author, 'assignedauthor');
    return {
      role: 'Author',
      name: readName(findFirst(findFirst(assigned, 'assignedperson'), 'name')).full,
      id: attr(findFirst(assigned, 'id'), 'extension') || attr(findFirst(assigned, 'id'), 'root'),
      specialty: codeLabel(findFirst(assigned, 'code')),
      organization: textOf(findFirst(findFirst(assigned, 'representedorganization'), 'name')),
    };
  });

  const participantRows: ProviderRow[] = findAll(doc, 'participant')
    .map((participant): ProviderRow | null => {
      const entity = findFirst(participant, 'associatedentity');
      const name = readName(findFirst(findFirst(entity, 'associatedperson'), 'name')).full;
      const id = attr(findFirst(entity, 'id'), 'extension');

      if (!name && !id) return null;

      const typeCode = attr(participant, 'typeCode');

      return {
        role: typeCode ? `Participant (${typeCode})` : 'Participant',
        name,
        id,
        specialty: '',
        organization: textOf(findFirst(findFirst(entity, 'scopingorganization'), 'name')),
      };
    })
    .filter((provider): provider is ProviderRow => provider !== null);

  const providers = [...authorRows, ...participantRows].filter(
    (provider) => provider.name || provider.id || provider.organization,
  );

  const services = findAll(doc, 'serviceevent')
    .map((serviceEvent) => {
      const statusElement =
        findFirst(serviceEvent, 'workflowstatuscode') ?? findFirst(serviceEvent, 'statuscode');

      return {
        name: codeLabel(findFirst(serviceEvent, 'code')),
        status: codeLabel(statusElement),
        id: attr(findFirst(serviceEvent, 'id'), 'extension'),
      };
    })
    .filter((service) => service.name || service.status);

  const title = textOf(direct(root, 'title')) || tagOf(root).toUpperCase();
  const statusElement = directChildren(root).find((child) => tagOf(child).endsWith('status'));
  const status = codeLabel(statusElement);
  const effectiveTimeRaw = attr(direct(root, 'effectivetime'), 'value');
  const effectiveTime = effectiveTimeRaw ? formatHl7Date(effectiveTimeRaw) : '';
  const language = attr(direct(root, 'languagecode'), 'code');
  const confidentiality = codeLabel(direct(root, 'confidentialitycode'));
  const documentId = attr(direct(root, 'id'), 'extension') || attr(direct(root, 'id'), 'root');
  const setId = attr(direct(root, 'setid'), 'extension') || attr(direct(root, 'setid'), 'root');

  const sections = collectSections(doc);

  return (
    <div style={containerStyle}>
      <div style={bannerStyle}>
        <h3 style={bannerTitleStyle}>{title}</h3>
        <div style={bannerMetaStyle}>
          {status && <span>Status: {status}</span>}
          {effectiveTime && <span>Date/Time: {effectiveTime}</span>}
          {documentId && <span>Document ID: {documentId}</span>}
          {setId && <span>Set ID: {setId}</span>}
          {versionNumber(root) && <span>Version: {versionNumber(root)}</span>}
          {language && <span>Language: {language}</span>}
          {confidentiality && <span>Confidentiality: {confidentiality}</span>}
        </div>
      </div>

      {(patientName || patientId) && (
        <div style={cardStyle}>
          <h4 style={cardHeaderStyle}>Patient</h4>
          <dl style={gridStyle}>
            <Field label="Name" value={patientName} />
            <Field label="Patient ID" value={patientId} />
            <Field label="Date of birth" value={birthDate} />
            <Field label="Gender" value={gender} />
            <Field label="Nationality" value={nationality} />
            <Field label="Phone" value={phone} />
            <Field label="Address" value={address} />
          </dl>
        </div>
      )}

      {encounter && (
        <div style={cardStyle}>
          <h4 style={cardHeaderStyle}>Encounter</h4>
          <dl style={gridStyle}>
            <Field label="Encounter ID" value={encounterId} />
            <Field label="Type" value={encounterType} />
            <Field label="Period" value={encounterPeriod} />
            <Field label="Facility" value={facility} />
          </dl>
        </div>
      )}

      {providers.length > 0 && (
        <div style={cardStyle}>
          <h4 style={cardHeaderStyle}>Providers</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {providers.map((provider, index) => (
              <div key={index} style={{ fontSize: '13px', color: '#334155' }}>
                <div style={{ fontWeight: 600 }}>{provider.name || provider.organization || '—'}</div>
                <div style={{ color: '#64748b', fontSize: '12px' }}>
                  {joinParts(provider.role, provider.specialty, provider.id, provider.organization)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {services.length > 0 && (
        <div style={cardStyle}>
          <h4 style={cardHeaderStyle}>Services</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
            {services.map((service, index) => (
              <div key={index} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600 }}>{service.name || 'Status'}</span>
                {service.status && <span style={{ color: '#0369a1' }}>{service.status}</span>}
                {service.id && <span style={{ color: '#64748b', fontSize: '12px' }}>{service.id}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {sections.map((section, index) => (
        <CdaSectionView key={index} doc={doc} section={section} />
      ))}
    </div>
  );
}

function versionNumber(root: Element): string {
  return attr(direct(root, 'versionnumber'), 'value');
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'contents' }}>
      <dt style={fieldNameStyle}>{label}</dt>
      <dd style={fieldValueStyle}>{value || 'N/A'}</dd>
    </div>
  );
}

const containerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  fontSize: '14px',
  color: '#334155',
};

const bannerStyle: CSSProperties = {
  background: '#f0f9ff',
  border: '1px solid #bae6fd',
  padding: '12px 16px',
  borderRadius: '6px',
};

const bannerTitleStyle: CSSProperties = {
  margin: '0 0 4px 0',
  color: '#0369a1',
  fontSize: '18px',
};

const bannerMetaStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '16px',
  fontSize: '12px',
  color: '#0369a1',
  fontWeight: 600,
};

const cardStyle: CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '6px',
  padding: '12px 16px',
};

const cardHeaderStyle: CSSProperties = {
  margin: '0 0 8px 0',
  fontSize: '14px',
  color: '#0f172a',
  borderBottom: '1px solid #f1f5f9',
  paddingBottom: '4px',
};

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(120px, max-content) 1fr',
  gap: '4px 12px',
  margin: 0,
  fontSize: '13px',
};

const fieldNameStyle: CSSProperties = {
  margin: 0,
  fontWeight: 600,
  color: '#334155',
};

const fieldValueStyle: CSSProperties = {
  margin: 0,
  color: '#0f172a',
  wordBreak: 'break-word',
};

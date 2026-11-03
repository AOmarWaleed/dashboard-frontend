import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, CSSProperties, ReactNode } from 'react';

// Minimal shapes for the FHIR fields rendered below (no type package needed).
type FhirCoding = { display?: string; code?: string; system?: string };
type FhirCodeableConcept = { text?: string; coding?: FhirCoding[] };
type FhirContactPoint = { system?: string; value?: string };
type FhirAddress = { line?: string[]; city?: string; state?: string; postalCode?: string; country?: string };
type FhirHumanName = {
  text?: string;
  given?: string[] | string;
  family?: string;
  prefix?: string[] | string;
  suffix?: string[] | string;
};
type FhirQuantity = { value?: number | string; unit?: string; code?: string };
type FhirIdentifier = { system?: string; value?: string | number };
type FhirBundleEntry = { fullUrl?: string; resource?: FhirResource };

type FhirResource = {
  resourceType: string;
  _isXml?: boolean;
  _rawXml?: string;
  _fullUrl?: string;
  id?: string;
  name?: FhirHumanName[] | FhirHumanName | string;
  telecom?: FhirContactPoint[] | FhirContactPoint;
  address?: FhirAddress[] | FhirAddress;
  identifier?: FhirIdentifier[];
  gender?: string;
  birthDate?: string;
  code?: FhirCodeableConcept;
  valueQuantity?: FhirQuantity;
  valueString?: string;
  status?: string;
  effectiveDateTime?: string;
  clinicalStatus?: FhirCodeableConcept;
  onsetDateTime?: string;
  recordedDate?: string;
  entry?: FhirBundleEntry[];
  contained?: FhirResource[];
  meta?: Record<string, unknown>;
  type?: string;
  total?: number;
  [key: string]: unknown;
};

type RenderContext = {
  index: Map<string, FhirResource>;
  currentResource?: FhirResource;
};

const TOP_LEVEL_EXCLUDED_KEYS = new Set([
  'resourceType',
  '_isXml',
  '_rawXml',
  '_fullUrl',
  'id',
  'meta',
  'contained',
  'entry',
  'text',
]);

const SUMMARY_KEYS: Record<string, string[]> = {
  Patient: ['name', 'gender', 'birthDate', 'telecom', 'address', 'identifier', 'maritalStatus'],
  Observation: ['code', 'valueQuantity', 'valueString', 'status', 'effectiveDateTime'],
  Condition: ['code', 'clinicalStatus', 'onsetDateTime', 'recordedDate'],
  Bundle: ['type', 'total', 'entry', 'timestamp', 'identifier'],
  MessageHeader: ['eventCoding', 'eventUri', 'destination', 'sender', 'source', 'focus', 'definition', 'response', 'author'],
  Claim: [
    'identifier',
    'status',
    'type',
    'subType',
    'use',
    'patient',
    'billablePeriod',
    'created',
    'insurer',
    'provider',
    'priority',
    'payee',
    'careTeam',
    'supportingInfo',
    'diagnosis',
    'insurance',
    'item',
    'total',
    'facility',
  ],
  CoverageEligibilityRequest: [
    'identifier',
    'status',
    'priority',
    'purpose',
    'patient',
    'servicedPeriod',
    'created',
    'provider',
    'insurer',
    'facility',
    'insurance',
    'item',
  ],
  Coverage: [
    'identifier',
    'status',
    'type',
    'policyHolder',
    'beneficiary',
    'relationship',
    'class',
    'period',
    'payor',
  ],
  MedicationDispense: [
    'identifier',
    'status',
    'category',
    'type',
    'subject',
    'context',
    'performer',
    'medicationReference',
    'medicationCodeableConcept',
    'quantity',
    'daysSupply',
    'whenPrepared',
    'whenHandedOver',
    'authorizingPrescription',
    'dosageInstruction',
  ],
  MedicationRequest: [
    'identifier',
    'status',
    'intent',
    'priority',
    'doNotPerform',
    'category',
    'groupIdentifier',
    'subject',
    'encounter',
    'requester',
    'authoredOn',
    'medicationReference',
    'medicationCodeableConcept',
    'reasonCode',
    'reasonReference',
    'note',
    'dosageInstruction',
    'dispenseRequest',
    'supportingInformation',
  ],
  Medication: ['code', 'form', 'batch'],
  MedicationKnowledge: ['code', 'status', 'manufacturer', 'doseForm', 'amount', 'packaging'],
  Encounter: [
    'identifier',
    'status',
    'class',
    'type',
    'serviceType',
    'priority',
    'subject',
    'period',
    'serviceProvider',
  ],
  Organization: ['identifier', 'active', 'type', 'name', 'telecom', 'address'],
  Practitioner: ['identifier', 'active', 'name', 'telecom', 'address', 'gender', 'birthDate', 'qualification'],
  PractitionerRole: [
    'identifier',
    'active',
    'period',
    'practitioner',
    'organization',
    'code',
    'specialty',
    'location',
    'healthcareService',
    'telecom',
  ],
  Location: ['identifier', 'status', 'name', 'type', 'managingOrganization', 'telecom', 'address'],
};

/** Resources that need the full grid width because they contain tables. */
const WIDE_RESOURCE_TYPES = new Set([
  'Bundle',
  'MessageHeader',
  'Claim',
  'ClaimResponse',
  'CoverageEligibilityRequest',
  'CoverageEligibilityResponse',
  'Coverage',
  'Encounter',
  'MedicationDispense',
  'MedicationRequest',
]);

/** Primary resources first, supporting resources afterwards. */
const RESOURCE_ORDER = [
  'Bundle',
  'Claim',
  'ClaimResponse',
  'CoverageEligibilityRequest',
  'CoverageEligibilityResponse',
  'MedicationRequest',
  'MedicationDispense',
  'Medication',
  'MedicationKnowledge',
  'Patient',
  'Coverage',
  'Encounter',
  'MessageHeader',
  'Organization',
  'PractitionerRole',
  'Practitioner',
  'Location',
];

const CONTACT_POINT_SYSTEMS = new Set(['phone', 'fax', 'email', 'pager', 'url', 'sms', 'other']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Coerces FHIR scalar values (which are sometimes numbers) into display text. */
function scalarText(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

/** Normalises FHIR cardinalities that arrive as either a single object or an array. */
function recordArray(value: unknown): Record<string, unknown>[] {
  if (value === null || value === undefined) return [];
  const items = Array.isArray(value) ? value : [value];
  return items.filter(isRecord);
}

function humanizeKey(key: string): string {
  const special: Record<string, string> = {
    id: 'ID',
    url: 'URL',
    uri: 'URI',
    uuid: 'UUID',
    asNeededBoolean: 'As Needed',
    asNeededCodeableConcept: 'As Needed',
  };

  if (special[key]) return special[key];

  return key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace(/\bId\b/g, 'ID')
    .replace(/\bUrl\b/g, 'URL');
}

function extensionLabel(url: string): string {
  if (!url) return '';

  const segment = url.split('/').filter(Boolean).pop() ?? '';
  const cleaned = segment
    .replace(/^StructureDefinition-/, '')
    .replace(/^Extension-/, '');

  return humanizeKey(cleaned);
}

function joinNamePart(part: unknown): string {
  if (typeof part === 'string') return part.trim();
  if (Array.isArray(part)) {
    return part
      .filter((value): value is string => typeof value === 'string')
      .join(' ')
      .trim();
  }
  return '';
}

function formatHumanName(name: Record<string, unknown>): string {
  const family = joinNamePart(name.family);
  const given = joinNamePart(name.given);
  const prefix = joinNamePart(name.prefix);
  const suffix = joinNamePart(name.suffix);
  const constructed = [prefix, given, family, suffix].filter(Boolean).join(' ');

  if (constructed) return constructed;
  return typeof name.text === 'string' ? name.text.trim() : '';
}

function formatCodeableConcept(concept: Record<string, unknown>): string {
  if (typeof concept.text === 'string') {
    const text = concept.text.trim();
    if (text && !text.startsWith('<')) return text;
  }

  const codings = Array.isArray(concept.coding) ? concept.coding : [];

  return codings
    .map((coding) => {
      if (!isRecord(coding)) return '';
      const display = typeof coding.display === 'string' ? coding.display.trim() : '';
      const code = typeof coding.code === 'string' ? coding.code.trim() : '';
      return display || code;
    })
    .filter(Boolean)
    .join(', ');
}

function looksLikeCodeableConcept(value: Record<string, unknown>): boolean {
  if (!('coding' in value) && typeof value.text !== 'string') return false;

  return Object.keys(value).every(
    (key) =>
      key === 'text' ||
      key === 'coding' ||
      key === 'extension' ||
      key === 'id' ||
      key.startsWith('_'),
  );
}

function formatCoding(coding: Record<string, unknown>): string {
  const display = typeof coding.display === 'string' ? coding.display.trim() : '';
  const code = typeof coding.code === 'string' ? coding.code.trim() : '';
  return display || code;
}

function formatIdentifier(identifier: Record<string, unknown>): string {
  const value = scalarText(identifier.value);
  if (value) return value;
  return scalarText(identifier.system);
}

function formatContactPoint(contact: Record<string, unknown>): string {
  const system = typeof contact.system === 'string' ? contact.system.trim() : '';
  const value = typeof contact.value === 'string' ? contact.value.trim() : '';
  return [system, value].filter(Boolean).join(': ');
}

function formatAddress(address: Record<string, unknown>): string {
  const line = Array.isArray(address.line)
    ? address.line.filter((item): item is string => typeof item === 'string').join(', ')
    : typeof address.line === 'string'
      ? address.line
      : '';

  return [line, address.city, address.state, address.postalCode, address.country]
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .map((part) => part.trim())
    .join(', ');
}

function formatQuantity(quantity: Record<string, unknown>): string {
  const rawValue = quantity.value;
  if (rawValue === undefined || rawValue === null) return '';

  const unit =
    (typeof quantity.unit === 'string' && quantity.unit.trim()) ||
    (typeof quantity.code === 'string' && quantity.code.trim()) ||
    '';

  return `${scalarText(rawValue)}${unit ? ` ${unit}` : ''}`;
}

function formatMoney(money: Record<string, unknown>): string {
  const value = scalarText(money.value);
  if (!value) return '';

  const currency = scalarText(money.currency);
  return currency ? `${value} ${currency}` : value;
}

function formatPeriod(period: Record<string, unknown>): string {
  const start = periodBound(period.start);
  const end = periodBound(period.end);

  if (start && end) return `${start} – ${end}`;
  return start || end;
}

/** Drops placeholder bounds such as "Invalid Date" coming from upstream writers. */
function periodBound(value: unknown): string {
  const text = scalarText(value);
  return /^invalid date$/i.test(text) ? '' : text;
}

function formatRange(range: Record<string, unknown>): string {
  const low = isRecord(range.low) ? formatQuantity(range.low) : '';
  const high = isRecord(range.high) ? formatQuantity(range.high) : '';

  if (low && high) return `${low} – ${high}`;
  return low || high;
}

function formatRatio(ratio: Record<string, unknown>): string {
  const numerator = isRecord(ratio.numerator) ? formatQuantity(ratio.numerator) : '';
  const denominator = isRecord(ratio.denominator) ? formatQuantity(ratio.denominator) : '';

  if (numerator && denominator) return `${numerator} : ${denominator}`;
  return numerator || denominator;
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function formatTiming(timing: Record<string, unknown>): string {
  const parts: string[] = [];

  if (isRecord(timing.code)) {
    const label = formatCodeableConcept(timing.code);
    if (label) parts.push(label);
  } else if (Array.isArray(timing.coding)) {
    const labels = timing.coding
      .map((coding) => (isRecord(coding) ? formatCoding(coding) : ''))
      .filter(Boolean);
    if (labels.length) parts.push(labels.join(', '));
  }

  if (isRecord(timing.repeat)) {
    const repeat = timing.repeat;

    if (isRecord(repeat.boundsPeriod)) {
      const bounds = formatPeriod(repeat.boundsPeriod);
      if (bounds) parts.push(bounds);
    } else if (isRecord(repeat.boundsDuration)) {
      const bounds = formatQuantity(repeat.boundsDuration);
      if (bounds) parts.push(bounds);
    } else if (isRecord(repeat.boundsRange)) {
      const bounds = formatRange(repeat.boundsRange);
      if (bounds) parts.push(bounds);
    }

    const frequency = asNumber(repeat.frequency);
    const period = asNumber(repeat.period);

    if (frequency !== null && period !== null) {
      const unit = typeof repeat.periodUnit === 'string' ? ` ${repeat.periodUnit}` : '';
      parts.push(`${frequency} per ${period}${unit}`);
    } else if (frequency !== null) {
      parts.push(`${frequency} time(s)`);
    }

    const count = asNumber(repeat.count);
    if (count !== null) {
      parts.push(`${count} time(s)`);
    }
  }

  if (Array.isArray(timing.event)) {
    const events = timing.event.filter((event): event is string => typeof event === 'string');
    if (events.length) parts.push(events.join(', '));
  }

  return parts.join(' — ');
}

function formatAttachment(attachment: Record<string, unknown>): string {
  const title = typeof attachment.title === 'string' ? attachment.title.trim() : '';
  if (title) return title;

  const url = typeof attachment.url === 'string' ? attachment.url.trim() : '';
  if (url) return url;

  return typeof attachment.contentType === 'string' ? attachment.contentType.trim() : '';
}

function resolveReferenceResource(
  reference: string,
  index: Map<string, FhirResource>,
  currentResource?: FhirResource,
): FhirResource | undefined {
  if (!reference) return undefined;

  if (reference.startsWith('#')) {
    const id = reference.slice(1);
    const contained = currentResource?.contained?.find((resource) => resource.id === id);
    return contained ?? index.get(reference);
  }

  const direct = index.get(reference);
  if (direct) return direct;

  // Absolute/canonical references: fall back to the trailing `ResourceType/id`.
  const tail = reference.split('/').filter(Boolean).slice(-2).join('/');
  if (tail) {
    const tailMatch = index.get(tail) ?? index.get(tail.toLowerCase());
    if (tailMatch) return tailMatch;
  }

  return index.get(reference.toLowerCase());
}

function resourceLabel(resource: FhirResource, index: Map<string, FhirResource>): string {
  if (resource.resourceType === 'Bundle') {
    return scalarText(resource.type);
  }

  if (resource.resourceType === 'MessageHeader') {
    const event = conceptLabel(resource.eventCoding) || scalarText(resource.eventUri);
    if (event) return event;
  }

  if (resource.resourceType === 'PractitionerRole') {
    const practitionerRef = resource.practitioner;
    if (isRecord(practitionerRef) && typeof practitionerRef.reference === 'string') {
      const practitioner = resolveReferenceResource(practitionerRef.reference, index);
      if (practitioner) return resourceLabel(practitioner, index);
    }
  }

  const name = resource.name;
  if (typeof name === 'string') return name;

  const humanName = Array.isArray(name) ? name[0] : name;
  if (isRecord(humanName)) {
    const formatted = formatHumanName(humanName);
    if (formatted) return formatted;
  }

  if (isRecord(resource.code)) {
    const concept = formatCodeableConcept(resource.code);
    if (concept) return concept;
  }

  if (typeof resource.title === 'string' && resource.title.trim()) {
    return resource.title.trim();
  }

  const firstIdentifier = resource.identifier
    ?.map((identifier) => scalarText(identifier.value))
    .find(Boolean);
  if (firstIdentifier) return firstIdentifier;

  return resource.id ?? '';
}

function formatReference(reference: Record<string, unknown>, context: RenderContext): string {
  const referenceValue = typeof reference.reference === 'string' ? reference.reference.trim() : '';
  const resolved = resolveReferenceResource(referenceValue, context.index, context.currentResource);
  const label = resolved ? resourceLabel(resolved, context.index) : '';
  const display = typeof reference.display === 'string' ? reference.display.trim() : '';

  // Reference.identifier is 0..1 in FHIR, so it can be a single object.
  const rawIdentifier = reference.identifier;
  const identifiers = Array.isArray(rawIdentifier)
    ? rawIdentifier
    : rawIdentifier
      ? [rawIdentifier]
      : [];
  const identifier =
    identifiers
      .map((item) => (isRecord(item) ? formatIdentifier(item) : scalarText(item)))
      .find(Boolean) ?? '';

  return display || label || identifier || referenceValue;
}

/** Readable label for a CodeableConcept, preferring display/text over codes. */
function conceptLabel(value: unknown): string {
  if (!isRecord(value)) return '';

  const text = scalarText(value.text);
  if (text) return text;

  const coding = recordArray(value.coding)[0];
  if (coding) {
    const display = scalarText(coding.display);
    if (display) return display;

    const code = scalarText(coding.code);
    if (code) return humanizeKey(code);
  }

  // Some fields (e.g. MessageHeader.eventCoding) are a bare Coding.
  const display = scalarText(value.display);
  if (display) return display;

  const bareCode = scalarText(value.code);
  if (bareCode) return humanizeKey(bareCode);

  return formatCodeableConcept(value);
}

/** Splits a CodeableConcept into its code, human label and optional description. */
function conceptParts(value: unknown): { label: string; code: string; description: string } {
  if (!isRecord(value)) return { label: '', code: '', description: '' };

  const coding = recordArray(value.coding)[0];
  const code = coding ? scalarText(coding.code) : '';
  const display = coding ? scalarText(coding.display) : '';
  const text = scalarText(value.text);
  const description = text || display;

  return {
    label: description || code,
    code,
    description,
  };
}

function conceptList(value: unknown): string {
  return recordArray(value)
    .map((concept) => conceptLabel(concept))
    .filter(Boolean)
    .join(', ');
}

function referenceLabel(value: unknown, context: RenderContext): string {
  return isRecord(value) ? formatReference(value, context) : '';
}

function listText(value: unknown): string {
  if (Array.isArray(value)) return value.map(scalarText).filter(Boolean).join(', ');
  return scalarText(value);
}

function identifierText(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((identifier) => identifierText(identifier)).filter(Boolean).join(', ');
  }
  if (isRecord(value)) return formatIdentifier(value);
  return scalarText(value);
}

function telecomText(value: unknown): string {
  return recordArray(value)
    .map((contact) => formatContactPoint(contact))
    .filter(Boolean)
    .join(', ');
}

function addressText(value: unknown): string {
  const first = Array.isArray(value) ? value[0] : value;
  return isRecord(first) ? formatAddress(first) : '';
}

function moneyText(value: unknown): string {
  return isRecord(value) ? formatMoney(value) : '';
}

function quantityText(value: unknown): string {
  return isRecord(value) ? formatQuantity(value) : '';
}

function periodText(value: unknown): string {
  return isRecord(value) ? formatPeriod(value) : '';
}

function formatInline(value: unknown, context: RenderContext): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (isRecord(value)) return formatFhirShape(value, context);
  return null;
}

function formatFhirShape(value: Record<string, unknown>, context: RenderContext): string | null {
  if (typeof value.url === 'string' && Object.keys(value).some((key) => key.startsWith('value'))) {
    const valueKey = Object.keys(value).find((key) => key.startsWith('value'));
    if (valueKey) {
      const inline = formatInline(value[valueKey], context);
      if (inline) return `${extensionLabel(value.url)}: ${inline}`;
    }
  }

  // Never render the Narrative XHTML markup.
  if ('div' in value) return null;

  if (
    'reference' in value ||
    'identifier' in value ||
    ('display' in value && !('coding' in value) && !('code' in value) && !('family' in value))
  ) {
    return formatReference(value, context);
  }

  if ('family' in value || 'given' in value || 'prefix' in value || 'suffix' in value) {
    return formatHumanName(value) || null;
  }

  if (
    typeof value.text === 'string' &&
    ('time' in value || 'authorString' in value || 'authorReference' in value)
  ) {
    return value.text.trim() || null;
  }

  if ('repeat' in value || 'event' in value) {
    return formatTiming(value) || null;
  }

  if (looksLikeCodeableConcept(value)) {
    return formatCodeableConcept(value) || null;
  }

  if ('code' in value && !('value' in value) && ('system' in value || 'display' in value)) {
    return formatCoding(value) || null;
  }

  if (
    'line' in value ||
    'city' in value ||
    'postalCode' in value ||
    'country' in value ||
    'state' in value
  ) {
    return formatAddress(value) || null;
  }

  if (
    'system' in value &&
    'value' in value &&
    typeof value.system === 'string' &&
    CONTACT_POINT_SYSTEMS.has(value.system)
  ) {
    return formatContactPoint(value) || null;
  }

  if ('value' in value && 'currency' in value) {
    return formatMoney(value) || null;
  }

  if ('value' in value) {
    const quantityKeys = new Set(['value', 'unit', 'code', 'system', 'comparator']);
    if (Object.keys(value).every((key) => quantityKeys.has(key))) {
      return formatQuantity(value) || null;
    }
  }

  if ('value' in value && ('system' in value || 'use' in value || 'type' in value || 'period' in value)) {
    return formatIdentifier(value) || null;
  }

  if ('start' in value || 'end' in value) {
    return formatPeriod(value) || null;
  }

  if ('low' in value || 'high' in value) {
    return formatRange(value) || null;
  }

  if ('numerator' in value || 'denominator' in value) {
    return formatRatio(value) || null;
  }

  if ('contentType' in value || 'data' in value || ('url' in value && 'title' in value)) {
    return formatAttachment(value) || null;
  }

  return null;
}

function isInlineValue(value: unknown, context: RenderContext): boolean {
  if (value === null || value === undefined) return true;
  if (Array.isArray(value)) {
    return value.every((item) => item === null || typeof item !== 'object');
  }
  if (isRecord(value)) {
    return formatFhirShape(value, context) !== null;
  }
  return true;
}

function displayName(name: unknown): string {
  if (typeof name === 'string') return name.trim();
  if (Array.isArray(name)) {
    for (const item of name) {
      const formatted = displayName(item);
      if (formatted) return formatted;
    }
    return '';
  }
  if (isRecord(name)) return formatHumanName(name);
  return '';
}

// Resolve references to readable labels using Bundle entries and contained resources.
function buildResourceIndex(resources: FhirResource[]): Map<string, FhirResource> {
  const index = new Map<string, FhirResource>();

  const add = (resource: FhirResource) => {
    if (resource.id) {
      const canonical = `${resource.resourceType}/${resource.id}`;
      index.set(canonical, resource);
      index.set(canonical.toLowerCase(), resource);
      index.set(`#${resource.id}`, resource);
    }

    if (resource._fullUrl) {
      index.set(resource._fullUrl, resource);
    }

    (resource.contained ?? []).forEach(add);
  };

  resources.forEach(add);
  return index;
}

function renderExtensions(value: unknown, context: RenderContext): ReactNode {
  const extensions = Array.isArray(value) ? value : [value];

  const rendered = extensions
    .map((extension, index) => {
      if (!isRecord(extension)) return null;

      const url = typeof extension.url === 'string' ? extension.url : '';
      const label = extensionLabel(url) || `Extension ${index + 1}`;
      const valueKey = Object.keys(extension).find((key) => key.startsWith('value'));
      const content = valueKey ? extension[valueKey] : extension.extension;

      if (content === undefined || content === null || content === '') return null;

      const inline = formatInline(content, context);
      const body = inline ?? renderValue(content, context);

      if (body === null || body === '') return null;

      return (
        <div key={`${url}-${index}`}>
          <strong>{label}:</strong> {body}
        </div>
      );
    })
    .filter((item) => item !== null);

  if (rendered.length === 0) return null;
  return <div style={{ display: 'grid', gap: '4px' }}>{rendered}</div>;
}

function renderObjectFields(record: Record<string, unknown>, context: RenderContext): ReactNode {
  const entries = Object.entries(record).filter(([key, value]) => {
    if (key === 'div' || key === 'resourceType' || key === '_isXml' || key === '_rawXml') {
      return false;
    }
    return value !== null && value !== undefined && value !== '';
  });

  if (entries.length === 0) return null;

  return (
    <div style={{ display: 'grid', gap: '6px' }}>
      {entries.map(([key, value]) => {
        const rendered =
          key === 'extension' || key === 'modifierExtension'
            ? renderExtensions(value, context)
            : renderValue(value, context);

        if (rendered === null || rendered === '') return null;

        const inline = isInlineValue(value, context);

        return (
          <div key={key}>
            <strong>{humanizeKey(key)}:</strong>{' '}
            {inline ? rendered : <div style={nestedGroupStyle}>{rendered}</div>}
          </div>
        );
      })}
    </div>
  );
}

function renderValue(value: unknown, context: RenderContext): ReactNode {
  if (value === null || value === undefined) return null;

  if (typeof value === 'string') return value.trim() || null;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  if (Array.isArray(value)) {
    const items = value.filter((item) => item !== null && item !== undefined && item !== '');
    if (items.length === 0) return null;

    if (items.every((item) => typeof item !== 'object')) {
      return items.map((item) => String(item)).join(', ');
    }

    return (
      <div style={{ display: 'grid', gap: '6px' }}>
        {items.map((item, index) => {
          const rendered = renderValue(item, context);
          if (rendered === null || rendered === '') return null;

          return (
            <div key={index} style={{ display: 'flex', gap: '6px' }}>
              <span style={{ color: '#64748b', minWidth: '18px' }}>{index + 1}.</span>
              <div style={{ flex: 1, minWidth: 0 }}>{rendered}</div>
            </div>
          );
        })}
      </div>
    );
  }

  if (isRecord(value)) {
    const inline = formatFhirShape(value, context);
    if (inline !== null) return inline || null;
    return renderObjectFields(value, context);
  }

  return String(value);
}

function renderResourceFields(
  resource: FhirResource,
  context: RenderContext,
  excludedKeys: Set<string>,
): ReactNode {
  const entries = Object.entries(resource).filter(([key, value]) => {
    if (TOP_LEVEL_EXCLUDED_KEYS.has(key)) return false;
    if (excludedKeys.has(key)) return false;
    return value !== null && value !== undefined && value !== '';
  });

  const renderedEntries = entries.flatMap(([key, value]) => {
    const rendered =
      key === 'extension' || key === 'modifierExtension'
        ? renderExtensions(value, context)
        : renderValue(value, context);

    if (rendered === null || rendered === '') return [];

    return [{ key, rendered, inline: isInlineValue(value, context) }];
  });

  if (renderedEntries.length === 0) return null;

  return (
    <div style={fieldGridStyle}>
      {renderedEntries.map(({ key, rendered, inline }) => (
        <div key={key} style={{ gridColumn: inline ? 'auto' : 'span 2', minWidth: 0 }}>
          <strong>{humanizeKey(key)}:</strong>{' '}
          {inline ? rendered : <div style={nestedGroupStyle}>{rendered}</div>}
        </div>
      ))}
    </div>
  );
}

type InfoItem = { label: string; value: ReactNode };

function InfoGrid({ items }: { items: InfoItem[] }) {
  const visible = items.filter(
    ({ value }) => value !== null && value !== undefined && value !== '',
  );

  if (visible.length === 0) return null;

  return (
    <div style={infoGridStyle}>
      {visible.map((item) => (
        <div key={item.label} style={{ display: 'contents' }}>
          <div style={infoLabelStyle}>{item.label}</div>
          <div style={infoValueStyle}>{item.value}</div>
        </div>
      ))}
    </div>
  );
}

function renderTableCell(value: ReactNode): ReactNode {
  if (value === null || value === undefined || value === '') return '—';
  return value;
}

function SummaryTable({ columns, rows }: { columns: string[]; rows: ReactNode[][] }) {
  if (rows.length === 0) return null;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={tableStyle}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} style={tableHeaderStyle}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((column, cellIndex) => (
                <td key={column} style={tableCellStyle}>
                  {renderTableCell(row[cellIndex])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SummarySection({ title, children }: { title: string; children: ReactNode }) {
  if (children === null || children === undefined) return null;

  return (
    <section style={{ marginTop: '14px' }}>
      <h5 style={subheadingStyle}>{title}</h5>
      {children}
    </section>
  );
}

/** Generic table for FHIR sub-resources that have no dedicated layout. */
function GenericRecordTable({
  records,
  context,
}: {
  records: Record<string, unknown>[];
  context: RenderContext;
}) {
  const columns = Array.from(new Set(records.flatMap((record) => Object.keys(record)))).filter(
    (key) => key !== 'resourceType' && key !== 'id',
  );

  if (columns.length === 0) return null;

  const rows = records.map((record) =>
    columns.map((column) => {
      const value = record[column];
      if (value === null || value === undefined || value === '') return '';

      if (column === 'extension' || column === 'modifierExtension') {
        return renderExtensions(value, context);
      }

      const inline = formatInline(value, context);
      return inline ?? renderValue(value, context);
    }),
  );

  return <SummaryTable columns={columns.map((column) => humanizeKey(column))} rows={rows} />;
}

function supportingInfoValue(info: Record<string, unknown>, context: RenderContext): ReactNode {
  const valueKey = Object.keys(info).find((key) => key.startsWith('value'));

  if (valueKey) {
    const value = info[valueKey];
    const inline = formatInline(value, context);
    if (inline) return inline;
    if (value !== null && value !== undefined && value !== '') {
      return renderValue(value, context);
    }
  }

  if (isRecord(info.code)) {
    const text = scalarText(info.code.text);
    if (text) return text;

    const concept = conceptLabel(info.code);
    if (concept) return concept;
  }

  if (isRecord(info.timing)) {
    const timing = formatTiming(info.timing);
    if (timing) return timing;
  }

  return '';
}

const CLAIM_ITEM_HANDLED_KEYS = new Set([
  'sequence',
  'extension',
  'modifierExtension',
  'careTeamSequence',
  'diagnosisSequence',
  'informationSequence',
  'productOrService',
  'servicedDate',
  'servicedPeriod',
  'quantity',
  'unitPrice',
  'factor',
  'net',
]);

function renderClaimItemDetails(
  item: Record<string, unknown>,
  context: RenderContext,
  index: number,
): ReactNode {
  const extensions =
    item.extension !== undefined ? renderExtensions(item.extension, context) : null;

  const extras = Object.fromEntries(
    Object.entries(item).filter(([key, value]) => {
      if (CLAIM_ITEM_HANDLED_KEYS.has(key)) return false;
      return value !== null && value !== undefined && value !== '';
    }),
  );

  const extrasRendered = Object.keys(extras).length > 0 ? renderObjectFields(extras, context) : null;

  if (extensions === null && extrasRendered === null) return null;

  const label = scalarText(item.sequence) || `${index + 1}`;

  return (
    <details key={`${label}-${index}`} style={detailsStyle}>
      <summary style={detailsSummaryStyle}>Item {label}</summary>
      <div style={{ display: 'grid', gap: '6px', marginTop: '6px' }}>
        {extensions}
        {extrasRendered}
      </div>
    </details>
  );
}

function messageHeaderInfo(header: FhirResource, context: RenderContext): InfoItem[] {
  const destination = recordArray(header.destination)
    .map((entry) => {
      const endpoint = scalarText(entry.endpoint);
      const receiver = referenceLabel(entry.receiver, context);
      return [endpoint, receiver].filter(Boolean).join(' — ');
    })
    .filter(Boolean)
    .join(' | ');

  const source = isRecord(header.source)
    ? [scalarText(header.source.name), scalarText(header.source.endpoint), scalarText(header.source.version)]
        .filter(Boolean)
        .join(' — ')
    : '';

  const focus = recordArray(header.focus)
    .map((entry) => referenceLabel(entry, context))
    .filter(Boolean)
    .join(', ');

  const response = isRecord(header.response)
    ? [conceptLabel(header.response.outcome), identifierText(header.response.identifier), scalarText(header.response.code)]
        .filter(Boolean)
        .join(' — ')
    : '';

  return [
    { label: 'Event', value: conceptLabel(header.eventCoding) || scalarText(header.eventUri) },
    { label: 'Sender', value: referenceLabel(header.sender, context) },
    { label: 'Destination', value: destination },
    { label: 'Source', value: source },
    { label: 'Focus', value: focus },
    { label: 'Author', value: referenceLabel(header.author, context) },
    { label: 'Response', value: response },
  ];
}

function resolvedMedication(
  resource: FhirResource,
  context: RenderContext,
): FhirResource | undefined {
  if (!isRecord(resource.medicationReference)) return undefined;

  const reference = scalarText(resource.medicationReference.reference);
  if (!reference) return undefined;

  return resolveReferenceResource(reference, context.index, context.currentResource);
}

function medicationDetails(
  resource: FhirResource,
  context: RenderContext,
): { name: string; code: string; form: string } {
  const referenced = resolvedMedication(resource, context);
  const concept =
    referenced && isRecord(referenced.code)
      ? referenced.code
      : isRecord(resource.medicationCodeableConcept)
        ? resource.medicationCodeableConcept
        : isRecord(resource.code)
          ? resource.code
          : null;
  const parts = conceptParts(concept);
  const form = referenced && isRecord(referenced.form) ? referenced.form : resource.form;

  return {
    name: parts.description || parts.label,
    code: parts.code,
    form: conceptLabel(form),
  };
}

function dosageDose(dosage: Record<string, unknown>): string {
  return recordArray(dosage.doseAndRate)
    .map((entry) => {
      if (isRecord(entry.doseQuantity)) return formatQuantity(entry.doseQuantity);
      if (isRecord(entry.doseRange)) return formatRange(entry.doseRange);
      return '';
    })
    .filter(Boolean)
    .join(', ');
}

function asNeededLabel(dosage: Record<string, unknown>): string {
  const value = dosage.asNeededBoolean;

  if (value === true || value === 'true') return 'Yes';
  if (value === false || value === 'false') return 'No';

  return conceptLabel(dosage.asNeededCodeableConcept);
}

function dosageInstructionRows(resource: FhirResource): string[][] {
  return recordArray(resource.dosageInstruction).map((dosage, index) => {
    const instruction = [scalarText(dosage.text), scalarText(dosage.patientInstruction)]
      .filter(Boolean)
      .join(' — ');

    return [
      String(index + 1),
      instruction,
      isRecord(dosage.timing) ? formatTiming(dosage.timing) : '',
      conceptLabel(dosage.route),
      conceptLabel(dosage.site),
      dosageDose(dosage),
      conceptList(dosage.additionalInstruction),
      asNeededLabel(dosage),
    ];
  });
}

function dispenseRequestItems(request: Record<string, unknown>): InfoItem[] {
  const initialFill = isRecord(request.initialFill) ? request.initialFill : null;

  return [
    { label: 'Validity Period', value: periodText(request.validityPeriod) },
    { label: 'Repeats Allowed', value: scalarText(request.numberOfRepeatsAllowed) },
    { label: 'Dispense Quantity', value: quantityText(request.quantity) },
    { label: 'Expected Supply', value: quantityText(request.expectedSupplyDuration) },
    { label: 'Dispense Interval', value: quantityText(request.dispenseInterval) },
    {
      label: 'Initial Fill',
      value: initialFill
        ? [
            quantityText(initialFill.quantity),
            isRecord(initialFill.duration) ? quantityText(initialFill.duration) : '',
          ]
            .filter(Boolean)
            .join(' · ')
        : '',
    },
  ];
}

function observationValue(
  observation: FhirResource,
  context: RenderContext,
): string {
  const valueKey = Object.keys(observation).find((key) => key.startsWith('value'));
  if (!valueKey) return '';

  const value = observation[valueKey];
  return formatInline(value, context) ?? scalarText(value);
}

function supportingInformationRows(
  resource: FhirResource,
  context: RenderContext,
): string[][] {
  return recordArray(resource.supportingInformation).map((entry) => {
    const reference = scalarText(entry.reference);
    const resolved = reference
      ? resolveReferenceResource(reference, context.index, context.currentResource)
      : undefined;

    if (resolved && resolved.resourceType === 'Observation') {
      return [
        conceptLabel(resolved.code) || resourceLabel(resolved, context.index),
        observationValue(resolved, context),
      ];
    }

    return [referenceLabel(entry, context), ''];
  });
}

function performerLabel(value: unknown, context: RenderContext): string {
  return recordArray(value)
    .map((entry) => referenceLabel(entry.actor, context))
    .filter(Boolean)
    .join(', ');
}

function conceptDetail(value: unknown): string {
  const parts = conceptParts(value);

  if (parts.code && parts.description && parts.code !== parts.description) {
    return `${parts.code} — ${parts.description}`;
  }

  return parts.label;
}

function reasonLabel(resource: FhirResource, context: RenderContext): string {
  return [
    conceptDetail(resource.reasonCode),
    referenceLabel(resource.reasonReference, context),
  ]
    .filter(Boolean)
    .join(' · ');
}

function noteText(value: unknown): string {
  return recordArray(value)
    .map((note) => scalarText(note.text))
    .filter(Boolean)
    .join(' · ');
}

function renderResourceSummary(resource: FhirResource, context: RenderContext): ReactNode {
  switch (resource.resourceType) {
    case 'Patient': {
      const fullName = displayName(resource.name);
      const telecom = Array.isArray(resource.telecom)
        ? resource.telecom
        : resource.telecom
          ? [resource.telecom]
          : [];
      const phones = telecom
        .filter((contact) => contact.system === 'phone')
        .map((contact) => contact.value ?? '')
        .filter(Boolean);
      const emails = telecom
        .filter((contact) => contact.system === 'email')
        .map((contact) => contact.value ?? '')
        .filter(Boolean);
      const addressValue = Array.isArray(resource.address) ? resource.address[0] : resource.address;
      const addressText = isRecord(addressValue) ? formatAddress(addressValue) : '';
      const nationalId =
        resource.identifier
          ?.map((identifier) => scalarText(identifier.value))
          .find(Boolean) ?? '';
      const maritalStatus = isRecord(resource.maritalStatus)
        ? formatCodeableConcept(resource.maritalStatus)
        : '';

      return (
        <div style={fieldGridStyle}>
          <div><strong>Name:</strong> {fullName || 'N/A'}</div>
          <div><strong>National ID:</strong> {nationalId || 'N/A'}</div>
          <div><strong>Gender:</strong> {resource.gender || 'N/A'}</div>
          <div><strong>Date of Birth:</strong> {resource.birthDate || 'N/A'}</div>
          <div><strong>Phone:</strong> {phones.join(', ') || 'N/A'}</div>
          <div><strong>Email:</strong> {emails.join(', ') || 'N/A'}</div>
          <div><strong>Marital Status:</strong> {maritalStatus || 'N/A'}</div>
          <div style={{ gridColumn: 'span 2' }}><strong>Address:</strong> {addressText || 'N/A'}</div>
        </div>
      );
    }

    case 'Observation': {
      const quantity = isRecord(resource.valueQuantity)
        ? formatQuantity(resource.valueQuantity)
        : '';
      const value = quantity || (typeof resource.valueString === 'string' ? resource.valueString : '');
      const code = isRecord(resource.code) ? formatCodeableConcept(resource.code) : '';

      return (
        <div style={fieldGridStyle}>
          <div><strong>Code:</strong> {code || 'N/A'}</div>
          <div><strong>Measured Value:</strong> {value || 'N/A'}</div>
          <div><strong>Status:</strong> {resource.status || 'N/A'}</div>
          <div><strong>Date:</strong> {resource.effectiveDateTime || 'N/A'}</div>
        </div>
      );
    }

    case 'Condition': {
      const diagnosis = isRecord(resource.code) ? formatCodeableConcept(resource.code) : '';
      const clinicalStatus = isRecord(resource.clinicalStatus)
        ? formatCodeableConcept(resource.clinicalStatus)
        : '';

      return (
        <div style={fieldGridStyle}>
          <div><strong>Diagnosis:</strong> {diagnosis || 'N/A'}</div>
          <div><strong>Clinical Status:</strong> {clinicalStatus || 'N/A'}</div>
          <div><strong>Onset Date:</strong> {resource.onsetDateTime || 'N/A'}</div>
          <div><strong>Recorded Date:</strong> {resource.recordedDate || 'N/A'}</div>
        </div>
      );
    }

    case 'Bundle': {
      const entries = resource.entry ?? [];
      const messageHeader = entries
        .map((entry) => entry.resource)
        .find(
          (entry): entry is FhirResource =>
            entry !== undefined && entry.resourceType === 'MessageHeader',
        );

      const messageInfo = messageHeader ? messageHeaderInfo(messageHeader, context) : [];
      const messageSummary = messageInfo.filter((item) =>
        ['Event', 'Sender', 'Destination', 'Focus'].includes(item.label),
      );

      return (
        <InfoGrid
          items={[
            { label: 'Type', value: scalarText(resource.type) },
            { label: 'Identifier', value: identifierText(resource.identifier) },
            { label: 'ID', value: scalarText(resource.id) },
            { label: 'Timestamp', value: scalarText(resource.timestamp) },
            { label: 'Entries', value: String(entries.length) },
            { label: 'Total', value: scalarText(resource.total) },
            ...messageSummary,
          ]}
        />
      );
    }

    case 'MessageHeader':
      return <InfoGrid items={messageHeaderInfo(resource, context)} />;

    case 'Claim': {
      const items = recordArray(resource.item);
      const diagnoses = recordArray(resource.diagnosis);
      const supportingInfo = recordArray(resource.supportingInfo);
      const careTeam = recordArray(resource.careTeam);
      const insurance = recordArray(resource.insurance);
      const focalInsurance = insurance.find((entry) => entry.focal === true) ?? insurance[0];
      const payee = isRecord(resource.payee) ? resource.payee : undefined;

      const header: InfoItem[] = [
        { label: 'Identifier', value: identifierText(resource.identifier) },
        { label: 'Status', value: scalarText(resource.status) },
        { label: 'Use', value: scalarText(resource.use) },
        {
          label: 'Type',
          value: [conceptLabel(resource.type), conceptLabel(resource.subType)]
            .filter(Boolean)
            .join(' / '),
        },
        { label: 'Priority', value: conceptLabel(resource.priority) },
        { label: 'Created', value: scalarText(resource.created) },
        { label: 'Billable Period', value: periodText(resource.billablePeriod) },
        { label: 'Patient', value: referenceLabel(resource.patient, context) },
        { label: 'Insurer', value: referenceLabel(resource.insurer, context) },
        { label: 'Provider', value: referenceLabel(resource.provider, context) },
        { label: 'Facility', value: referenceLabel(resource.facility, context) },
        {
          label: 'Coverage',
          value: focalInsurance ? referenceLabel(focalInsurance.coverage, context) : '',
        },
        { label: 'Payee', value: payee ? conceptLabel(payee.type) : '' },
        { label: 'Total', value: moneyText(resource.total) },
      ];

      const hasInformation = items.some((item) => item.informationSequence !== undefined);
      const serviceColumns = [
        '#',
        'Service',
        'Qty',
        'Unit Price',
        'Net',
        'Serviced',
        'Dx',
        'Care Team',
        ...(hasInformation ? ['Info'] : []),
      ];

      const serviceRows = items.map((item) => [
        scalarText(item.sequence) || '—',
        conceptParts(item.productOrService).label,
        quantityText(item.quantity),
        moneyText(item.unitPrice),
        moneyText(item.net),
        scalarText(item.servicedDate) || periodText(item.servicedPeriod),
        listText(item.diagnosisSequence),
        listText(item.careTeamSequence),
        ...(hasInformation ? [listText(item.informationSequence)] : []),
      ]);

      const diagnosisRows = diagnoses.map((diagnosis) => {
        const parts = conceptParts(diagnosis.diagnosisCodeableConcept);
        const type = conceptParts(recordArray(diagnosis.type)[0]).label;

        return [
          scalarText(diagnosis.sequence) || '—',
          parts.code || parts.label,
          parts.description || (parts.code ? '' : parts.label),
          type,
        ];
      });

      const supportingInfoRows = supportingInfo.map((info) => [
        scalarText(info.sequence) || '—',
        conceptLabel(info.category),
        supportingInfoValue(info, context),
      ]);

      const careTeamRows = careTeam.map((member) => [
        scalarText(member.sequence) || '—',
        referenceLabel(member.provider, context),
        conceptLabel(member.role),
        conceptLabel(member.qualification),
      ]);

      const insuranceRows = insurance.map((entry) => [
        scalarText(entry.sequence) || '—',
        entry.focal === true ? 'Yes' : entry.focal === false ? 'No' : '',
        referenceLabel(entry.coverage, context),
        scalarText(entry.businessArrangement),
      ]);

      const itemDetails = items.map((item, index) =>
        renderClaimItemDetails(item, context, index),
      );
      const hasItemDetails = itemDetails.some((detail) => detail !== null);

      return (
        <>
          <InfoGrid items={header} />

          {diagnosisRows.length > 0 && (
            <SummarySection title="Diagnosis">
              <SummaryTable
                columns={['#', 'Code', 'Description', 'Type']}
                rows={diagnosisRows}
              />
            </SummarySection>
          )}

          {serviceRows.length > 0 && (
            <SummarySection title="Services">
              <SummaryTable columns={serviceColumns} rows={serviceRows} />
            </SummarySection>
          )}

          {supportingInfoRows.length > 0 && (
            <SummarySection title={`Supporting Information (${supportingInfoRows.length})`}>
              <SummaryTable columns={['#', 'Category', 'Value']} rows={supportingInfoRows} />
            </SummarySection>
          )}

          {insuranceRows.length > 0 && (
            <SummarySection title="Insurance">
              <SummaryTable
                columns={['#', 'Focal', 'Coverage', 'Business Arrangement']}
                rows={insuranceRows}
              />
            </SummarySection>
          )}

          {careTeamRows.length > 0 && (
            <SummarySection title="Care Team">
              <SummaryTable
                columns={['#', 'Provider', 'Role', 'Qualification']}
                rows={careTeamRows}
              />
            </SummarySection>
          )}

          {hasItemDetails && (
            <SummarySection title="Line Item Details">{itemDetails}</SummarySection>
          )}
        </>
      );
    }

    case 'CoverageEligibilityRequest': {
      const insurance = recordArray(resource.insurance);
      const items = recordArray(resource.item);

      return (
        <>
          <InfoGrid
            items={[
              { label: 'Identifier', value: identifierText(resource.identifier) },
              { label: 'Status', value: scalarText(resource.status) },
              { label: 'Purpose', value: listText(resource.purpose) },
              { label: 'Priority', value: conceptLabel(resource.priority) },
              { label: 'Created', value: scalarText(resource.created) },
              { label: 'Patient', value: referenceLabel(resource.patient, context) },
              { label: 'Serviced Period', value: periodText(resource.servicedPeriod) },
              { label: 'Insurer', value: referenceLabel(resource.insurer, context) },
              { label: 'Provider', value: referenceLabel(resource.provider, context) },
              { label: 'Facility', value: referenceLabel(resource.facility, context) },
            ]}
          />

          {insurance.length > 0 && (
            <SummarySection title="Insurance">
              <GenericRecordTable records={insurance} context={context} />
            </SummarySection>
          )}

          {items.length > 0 && (
            <SummarySection title="Items">
              <GenericRecordTable records={items} context={context} />
            </SummarySection>
          )}
        </>
      );
    }

    case 'Coverage': {
      const classes = recordArray(resource.class);

      return (
        <>
          <InfoGrid
            items={[
              { label: 'Member ID', value: identifierText(resource.identifier) },
              { label: 'Status', value: scalarText(resource.status) },
              { label: 'Type', value: conceptLabel(resource.type) },
              { label: 'Relationship', value: conceptLabel(resource.relationship) },
              { label: 'Beneficiary', value: referenceLabel(resource.beneficiary, context) },
              { label: 'Policy Holder', value: referenceLabel(resource.policyHolder, context) },
              {
                label: 'Payor',
                value: recordArray(resource.payor)
                  .map((payor) => referenceLabel(payor, context))
                  .filter(Boolean)
                  .join(', '),
              },
              { label: 'Period', value: periodText(resource.period) },
            ]}
          />

          {classes.length > 0 && (
            <SummarySection title="Classes">
              <SummaryTable
                columns={['Type', 'Value', 'Name']}
                rows={classes.map((entry) => [
                  conceptLabel(entry.type),
                  scalarText(entry.value),
                  scalarText(entry.name),
                ])}
              />
            </SummarySection>
          )}
        </>
      );
    }

    case 'MedicationDispense': {
      const medication = medicationDetails(resource, context);
      const dosageRows = dosageInstructionRows(resource);

      return (
        <>
          <InfoGrid
            items={[
              { label: 'Dispense ID', value: identifierText(resource.identifier) },
              { label: 'Status', value: scalarText(resource.status) },
              { label: 'Type', value: conceptLabel(resource.type) },
              { label: 'Category', value: conceptList(resource.category) },
              {
                label: 'Medication',
                value: medication.name || resourceLabel(resource, context.index),
              },
              { label: 'Medication Code', value: medication.code },
              { label: 'Form', value: medication.form },
              { label: 'Patient', value: referenceLabel(resource.subject, context) },
              { label: 'Encounter', value: referenceLabel(resource.context, context) },
              { label: 'Performer', value: performerLabel(resource.performer, context) },
              { label: 'Prepared', value: scalarText(resource.whenPrepared) },
              { label: 'Handed Over', value: scalarText(resource.whenHandedOver) },
              { label: 'Quantity', value: quantityText(resource.quantity) },
              { label: 'Days Supply', value: quantityText(resource.daysSupply) },
              {
                label: 'Authorizing Prescription',
                value: referenceLabel(resource.authorizingPrescription, context),
              },
            ]}
          />

          {dosageRows.length > 0 && (
            <SummarySection title="Dosage Instructions">
              <SummaryTable
                columns={[
                  '#',
                  'Instruction',
                  'Timing',
                  'Route',
                  'Site',
                  'Dose',
                  'Additional Instruction',
                  'As Needed',
                ]}
                rows={dosageRows}
              />
            </SummarySection>
          )}
        </>
      );
    }

    case 'MedicationRequest': {
      const medication = medicationDetails(resource, context);
      const dosageRows = dosageInstructionRows(resource);
      const dispenseRequest = isRecord(resource.dispenseRequest)
        ? resource.dispenseRequest
        : null;
      const supportingRows = supportingInformationRows(resource, context);

      return (
        <>
          <InfoGrid
            items={[
              { label: 'Prescription ID', value: identifierText(resource.identifier) },
              { label: 'Status', value: scalarText(resource.status) },
              { label: 'Intent', value: humanizeKey(scalarText(resource.intent)) },
              { label: 'Priority', value: humanizeKey(scalarText(resource.priority)) },
              { label: 'Category', value: conceptList(resource.category) },
              { label: 'Group ID', value: identifierText(resource.groupIdentifier) },
              {
                label: 'Medication',
                value: medication.name || resourceLabel(resource, context.index),
              },
              { label: 'Medication Code', value: medication.code },
              { label: 'Form', value: medication.form },
              { label: 'Patient', value: referenceLabel(resource.subject, context) },
              { label: 'Encounter', value: referenceLabel(resource.encounter, context) },
              { label: 'Requester', value: referenceLabel(resource.requester, context) },
              { label: 'Authored On', value: scalarText(resource.authoredOn) },
              { label: 'Reason', value: reasonLabel(resource, context) },
              { label: 'Notes', value: noteText(resource.note) },
              {
                label: 'Do Not Perform',
                value:
                  typeof resource.doNotPerform === 'boolean'
                    ? resource.doNotPerform
                      ? 'Yes'
                      : 'No'
                    : '',
              },
            ]}
          />

          {dosageRows.length > 0 && (
            <SummarySection title="Dosage Instructions">
              <SummaryTable
                columns={[
                  '#',
                  'Instruction',
                  'Timing',
                  'Route',
                  'Site',
                  'Dose',
                  'Additional Instruction',
                  'As Needed',
                ]}
                rows={dosageRows}
              />
            </SummarySection>
          )}

          {dispenseRequest && (
            <SummarySection title="Dispense Request">
              <InfoGrid items={dispenseRequestItems(dispenseRequest)} />
            </SummarySection>
          )}

          {supportingRows.length > 0 && (
            <SummarySection title={`Supporting Information (${supportingRows.length})`}>
              <SummaryTable
                columns={['Supporting Information', 'Value']}
                rows={supportingRows}
              />
            </SummarySection>
          )}
        </>
      );
    }

    case 'Medication': {
      const medication = medicationDetails(resource, context);
      const batch = isRecord(resource.batch) ? resource.batch : null;

      return (
        <InfoGrid
          items={[
            {
              label: 'Medication',
              value: medication.name || resourceLabel(resource, context.index),
            },
            { label: 'Code', value: medication.code },
            { label: 'Form', value: medication.form },
            { label: 'Batch Lot', value: batch ? scalarText(batch.lotNumber) : '' },
            { label: 'Batch Expiration', value: batch ? scalarText(batch.expirationDate) : '' },
          ]}
        />
      );
    }

    case 'MedicationKnowledge': {
      const packaging = isRecord(resource.packaging) ? resource.packaging : null;
      const amount = isRecord(resource.amount)
        ? formatRatio(resource.amount) || quantityText(resource.amount)
        : '';

      return (
        <InfoGrid
          items={[
            {
              label: 'Medication',
              value: conceptLabel(resource.code),
            },
            { label: 'Status', value: scalarText(resource.status) },
            { label: 'Manufacturer', value: referenceLabel(resource.manufacturer, context) },
            { label: 'Dose Form', value: conceptLabel(resource.doseForm) },
            { label: 'Amount', value: amount },
            { label: 'Packaging Type', value: packaging ? conceptLabel(packaging.type) : '' },
            {
              label: 'Packaging Quantity',
              value: packaging ? quantityText(packaging.quantity) : '',
            },
          ]}
        />
      );
    }

    case 'Encounter':
      return (
        <InfoGrid
          items={[
            { label: 'Identifier', value: identifierText(resource.identifier) },
            { label: 'Status', value: scalarText(resource.status) },
            {
              label: 'Class',
              value: isRecord(resource.class) ? formatCoding(resource.class) : '',
            },
            { label: 'Type', value: conceptList(resource.type) },
            { label: 'Service Type', value: conceptLabel(resource.serviceType) },
            { label: 'Priority', value: conceptLabel(resource.priority) },
            { label: 'Subject', value: referenceLabel(resource.subject, context) },
            { label: 'Period', value: periodText(resource.period) },
            { label: 'Service Provider', value: referenceLabel(resource.serviceProvider, context) },
          ]}
        />
      );

    case 'Organization':
      return (
        <InfoGrid
          items={[
            { label: 'Name', value: scalarText(resource.name) },
            {
              label: 'Active',
              value: typeof resource.active === 'boolean' ? (resource.active ? 'Yes' : 'No') : '',
            },
            { label: 'Type', value: conceptList(resource.type) },
            { label: 'Identifier', value: identifierText(resource.identifier) },
            { label: 'Phone', value: telecomText(resource.telecom) },
            { label: 'Address', value: addressText(resource.address) },
          ]}
        />
      );

    case 'Practitioner': {
      const qualifications = recordArray(resource.qualification)
        .map((qualification) => {
          const concept = conceptLabel(qualification.code);
          const issuer = referenceLabel(qualification.issuer, context);
          return [concept, issuer ? `(${issuer})` : ''].filter(Boolean).join(' ');
        })
        .filter(Boolean)
        .join('; ');

      return (
        <InfoGrid
          items={[
            { label: 'Name', value: displayName(resource.name) },
            {
              label: 'Active',
              value: typeof resource.active === 'boolean' ? (resource.active ? 'Yes' : 'No') : '',
            },
            { label: 'Identifier', value: identifierText(resource.identifier) },
            { label: 'Gender', value: scalarText(resource.gender) },
            { label: 'Date of Birth', value: scalarText(resource.birthDate) },
            { label: 'Phone', value: telecomText(resource.telecom) },
            { label: 'Address', value: addressText(resource.address) },
            { label: 'Qualification', value: qualifications },
          ]}
        />
      );
    }

    case 'PractitionerRole':
      return (
        <InfoGrid
          items={[
            { label: 'Practitioner', value: referenceLabel(resource.practitioner, context) },
            { label: 'Organization', value: referenceLabel(resource.organization, context) },
            { label: 'Role', value: conceptList(resource.code) },
            { label: 'Specialty', value: conceptList(resource.specialty) },
            { label: 'Identifier', value: identifierText(resource.identifier) },
            {
              label: 'Active',
              value: typeof resource.active === 'boolean' ? (resource.active ? 'Yes' : 'No') : '',
            },
            { label: 'Period', value: periodText(resource.period) },
            {
              label: 'Location',
              value: recordArray(resource.location)
                .map((location) => referenceLabel(location, context))
                .filter(Boolean)
                .join(', '),
            },
          ]}
        />
      );

    case 'Location':
      return (
        <InfoGrid
          items={[
            { label: 'Name', value: scalarText(resource.name) },
            { label: 'Status', value: scalarText(resource.status) },
            { label: 'Type', value: conceptList(resource.type) },
            { label: 'Identifier', value: identifierText(resource.identifier) },
            {
              label: 'Managing Organization',
              value: referenceLabel(resource.managingOrganization, context),
            },
            { label: 'Phone', value: telecomText(resource.telecom) },
            { label: 'Address', value: addressText(resource.address) },
          ]}
        />
      );

    default:
      return null;
  }
}

function renderContainedResources(resource: FhirResource, context: RenderContext): ReactNode {
  if (!Array.isArray(resource.contained) || resource.contained.length === 0) return null;

  return (
    <div style={containedSectionStyle}>
      <h5 style={subheadingStyle}>Contained Resources</h5>
      {resource.contained.map((child, index) => (
        <div key={`${child.resourceType}-${child.id ?? index}`} style={containedCardStyle}>
          <h6 style={containedHeadingStyle}>Contained {child.resourceType}</h6>
          {renderResourceBody(child, context)}
        </div>
      ))}
    </div>
  );
}

function renderResourceBody(resource: FhirResource, context: RenderContext): ReactNode {
  const resourceContext: RenderContext = { ...context, currentResource: resource };
  const summary = renderResourceSummary(resource, resourceContext);
  const summaryKeys = SUMMARY_KEYS[resource.resourceType] ?? [];
  const details = renderResourceFields(resource, resourceContext, new Set(summaryKeys));
  const contained = renderContainedResources(resource, resourceContext);

  if (summary === null && details === null && contained === null) {
    return <p style={emptyTextStyle}>No displayable fields for this resource type.</p>;
  }

  return (
    <>
      {summary}
      {details !== null && (
        <>
          {summary !== null && <h5 style={subheadingStyle}>Additional Details</h5>}
          {details}
        </>
      )}
      {contained}
    </>
  );
}

function isFhirResource(value: unknown): value is FhirResource {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { resourceType?: unknown }).resourceType === 'string'
  );
}

// A Bundle is shown as one summary card followed by one card per entry resource.
function collectResources(resource: FhirResource): FhirResource[] {
  if (resource.resourceType !== 'Bundle') return [resource];

  const entries = resource.entry ?? [];

  return [
    resource,
    ...entries.flatMap((entry) => {
      if (!entry.resource) return [];
      if (entry.fullUrl) entry.resource._fullUrl = entry.fullUrl;
      return collectResources(entry.resource);
    }),
  ];
}

type FhirViewerProps = {
  /** When set, the viewer renders this content instead of its own upload control. */
  content?: string;
  /** File name to display when a parent component supplies the content. */
  fileName?: string;
};

export function FhirViewer({ content, fileName: providedFileName }: FhirViewerProps = {}) {
  const [parsedResources, setParsedResources] = useState<FhirResource[] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isEmbedded = content !== undefined;
  const displayedFileName = isEmbedded ? providedFileName ?? null : fileName;
  const resourceIndex = buildResourceIndex(parsedResources ?? []);

  const parseFhirContent = (text: string) => {
    const trimmed = text.trim();

    if (trimmed.startsWith('{')) {
      try {
        const json: unknown = JSON.parse(trimmed);

        if (!isFhirResource(json)) {
          setParsedResources(null);
          setError(
            'The file contains valid JSON but is not a FHIR resource (missing "resourceType").',
          );
          return;
        }

        setError(null);
        setParsedResources(collectResources(json));
      } catch {
        setParsedResources(null);
        setError('Invalid JSON format.');
      }
      return;
    }

    if (trimmed.startsWith('<')) {
      try {
        const xmlDoc = new DOMParser().parseFromString(trimmed, 'text/xml');

        if (xmlDoc.querySelector('parsererror')) {
          setParsedResources(null);
          setError('Invalid XML format.');
          return;
        }

        setError(null);
        setParsedResources([
          {
            resourceType: xmlDoc.documentElement.localName || xmlDoc.documentElement.tagName,
            _isXml: true,
            _rawXml: trimmed,
          },
        ]);
      } catch {
        setParsedResources(null);
        setError('Failed to parse XML file.');
      }
      return;
    }

    setParsedResources(null);
    setError('File content is neither valid JSON nor XML.');
  };

  // Keep the viewer in sync when a parent component supplies the content.
  useEffect(() => {
    if (content !== undefined) {
      parseFhirContent(content);
    }
  }, [content]);

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text !== 'string') {
        setParsedResources(null);
        setError('Could not read the selected file.');
        return;
      }

      parseFhirContent(text);
    };

    reader.onerror = () => {
      setParsedResources(null);
      setError('Could not read the selected file.');
    };

    reader.readAsText(file);

    // Reset the input so that re-selecting the same file fires `onChange` again.
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleClear = () => {
    setParsedResources(null);
    setFileName(null);
    setError(null);
  };

  // Helper function to map a FHIR resource to human-readable structured details
  const renderReadableResource = (resource: FhirResource) => {
    if (resource._isXml) {
      return (
        <div style={{ fontSize: '14px' }}>
          <div style={fieldGridStyle}>
            <div><strong>Format:</strong> XML</div>
            <div><strong>Root Element:</strong> {resource.resourceType}</div>
          </div>
          <p style={{ margin: '12px 0 6px', color: '#475569' }}>
            Structured field rendering is available for JSON FHIR resources. The original XML is shown below.
          </p>
          <details>
            <summary style={{ cursor: 'pointer', color: '#0284c7', fontWeight: 600 }}>
              Show raw XML
            </summary>
            <pre style={rawXmlStyle}>{resource._rawXml ?? ''}</pre>
          </details>
        </div>
      );
    }

    return renderResourceBody(resource, { index: resourceIndex });
  };

  const sortedResources = parsedResources
    ? [...parsedResources].sort(
        (left, right) =>
          resourceOrder(left.resourceType) - resourceOrder(right.resourceType),
      )
    : null;

  return (
    <div style={{ padding: '20px' }}>

      {!isEmbedded && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <input
            ref={inputRef}
            type="file"
            accept=".json,.xml"
            onChange={handleFileUpload}
          />
          {parsedResources && (
            <button type="button" onClick={handleClear}>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
        {sortedResources && sortedResources.map((resource, index) => {
          const label = resource._isXml ? '' : resourceLabel(resource, resourceIndex);
          const heading = resource._isXml
            ? `${resource.resourceType} (XML)`
            : label
              ? `${resource.resourceType} — ${label}`
              : resource.resourceType;

          return (
            <div
              key={`${resource.resourceType}-${resource.id ?? index}`}
              style={{
                marginBottom: '15px',
                border: '1px solid #cbd5e1',
                padding: '15px',
                borderRadius: '8px',
                background: '#f8fafc',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                gridColumn: WIDE_RESOURCE_TYPES.has(resource.resourceType)
                  ? '1 / -1'
                  : undefined,
              }}
            >
              <h4 style={{ margin: '0 0 12px 0', color: '#0284c7', borderBottom: '2px solid #e2e8f0', paddingBottom: '6px' }}>
                {heading}
              </h4>
              {renderReadableResource(resource)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function resourceOrder(resourceType: string): number {
  const position = RESOURCE_ORDER.indexOf(resourceType);
  return position === -1 ? RESOURCE_ORDER.length : position;
}

const fieldGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '8px 16px',
  fontSize: '14px',
};

const infoGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(130px, max-content) 1fr',
  gap: '6px 16px',
  fontSize: '14px',
};

const infoLabelStyle: CSSProperties = {
  fontWeight: 600,
  color: '#334155',
};

const infoValueStyle: CSSProperties = {
  color: '#0f172a',
  wordBreak: 'break-word',
};

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '13px',
  color: '#334155',
};

const tableHeaderStyle: CSSProperties = {
  textAlign: 'left',
  padding: '6px 8px',
  background: '#f1f5f9',
  borderBottom: '1px solid #cbd5e1',
  fontWeight: 600,
  whiteSpace: 'nowrap',
};

const tableCellStyle: CSSProperties = {
  padding: '6px 8px',
  borderBottom: '1px solid #e2e8f0',
  verticalAlign: 'top',
};

const detailsStyle: CSSProperties = {
  marginTop: '8px',
  fontSize: '13px',
};

const detailsSummaryStyle: CSSProperties = {
  cursor: 'pointer',
  color: '#0369a1',
  fontWeight: 600,
};

const nestedGroupStyle: CSSProperties = {
  marginTop: '4px',
  paddingLeft: '12px',
  borderLeft: '2px solid #cbd5e1',
  display: 'grid',
  gap: '6px',
};

const subheadingStyle: CSSProperties = {
  margin: '16px 0 8px',
  fontSize: '13px',
  fontWeight: 700,
  color: '#334155',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const containedSectionStyle: CSSProperties = {
  marginTop: '16px',
  borderTop: '1px solid #e2e8f0',
  paddingTop: '12px',
};

const containedCardStyle: CSSProperties = {
  marginTop: '10px',
  padding: '12px',
  border: '1px solid #dbe3ee',
  borderRadius: '6px',
  background: '#ffffff',
};

const containedHeadingStyle: CSSProperties = {
  margin: '0 0 10px',
  fontSize: '14px',
  color: '#0f172a',
};

const rawXmlStyle: CSSProperties = {
  marginTop: '8px',
  padding: '12px',
  background: '#0f172a',
  color: '#e2e8f0',
  borderRadius: '6px',
  overflow: 'auto',
  maxHeight: '500px',
  fontSize: '12px',
  lineHeight: 1.5,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
};

const emptyTextStyle: CSSProperties = {
  margin: 0,
  fontSize: '14px',
  color: '#64748b',
};

export default FhirViewer;

/**
 * Generic XML helpers shared by the XML viewers.
 *
 * These utilities intentionally know nothing about any particular document or
 * sample. They only deal with structural primitives (elements, attributes,
 * references) so every renderer can stay data-driven.
 */

export type XmlShape =
  | 'registry-response'
  | 'xds-submission'
  | 'clinical-document'
  | 'xml';

/** Tag name with any namespace prefix removed, lower-cased. */
export function tagOf(element: Element): string {
  return (element.localName || element.tagName.replace(/^.*:/, '')).toLowerCase();
}

export function directChildren(element: Element, tag?: string): Element[] {
  const children = Array.from(element.children);
  if (tag === undefined) return children;
  const normalized = tag.toLowerCase();
  return children.filter((child) => tagOf(child) === normalized);
}

export function allElements(root: ParentNode): Element[] {
  return Array.from(root.querySelectorAll('*'));
}

export function findAll(root: ParentNode | null | undefined, tag: string): Element[] {
  if (!root) return [];
  const normalized = tag.toLowerCase();
  return allElements(root).filter((element) => tagOf(element) === normalized);
}

export function findFirst(
  root: ParentNode | null | undefined,
  tag: string,
): Element | null {
  if (!root) return null;
  const normalized = tag.toLowerCase();
  const elements = allElements(root);
  return elements.find((element) => tagOf(element) === normalized) ?? null;
}

export function attr(element: Element | null | undefined, name: string): string {
  return element?.getAttribute(name)?.trim() ?? '';
}

export function textOf(element: Element | null | undefined): string {
  return element?.textContent?.trim() ?? '';
}

export function isBase64Like(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length < 16) return false;
  const compact = trimmed.replace(/\s/g, '');
  return /^[A-Za-z0-9+/]+={0,2}$/.test(compact) && compact.length % 4 === 0;
}

export function decodeBase64Utf8(value: string): string | null {
  const compact = value.trim().replace(/\s/g, '');
  if (!compact) return null;

  try {
    const binary = atob(compact);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

    if (typeof TextDecoder === 'undefined') return binary;
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  } catch {
    return null;
  }
}

export function parseXml(content: string): Document | null {
  try {
    const parsed = new DOMParser().parseFromString(content, 'application/xml');
    if (parsed.querySelector('parsererror')) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Resolves a narrative reference (`#id`, `#xpointer(id('...'))`) against the
 * document. Returns `null` when the target cannot be found.
 */
export function resolveReference(xmlDoc: Document, reference: string): string | null {
  let id = reference.trim();
  if (!id) return null;

  if (id.startsWith('#')) id = id.slice(1);

  const xpointer = id.match(/^xpointer\((.*)\)$/);
  if (xpointer) {
    id = xpointer[1].trim();
    const idMatch = id.match(/^id\((['"]?)(.*)\1\)$/);
    id = idMatch ? idMatch[2] : id;
  }

  if (!id) return null;

  const target = allElements(xmlDoc).find((element) => {
    return (
      element.getAttribute('ID') === id ||
      element.getAttribute('xml:id') === id ||
      element.getAttribute('id') === id
    );
  });

  if (!target) return null;
  return textOf(target) || null;
}

/** Returns the referenced narrative text when present, otherwise the element text. */
export function textOrReference(
  xmlDoc: Document,
  element: Element | null | undefined,
): string {
  if (!element) return '';

  const referenceElement = findFirst(element, 'reference');
  const reference = attr(referenceElement, 'value');
  if (reference) {
    const resolved = resolveReference(xmlDoc, reference);
    if (resolved !== null) return resolved;
  }

  return textOf(element);
}

export function firstReferenceText(xmlDoc: Document, element: Element | null): string {
  if (!element) return '';
  const reference = attr(findFirst(element, 'reference'), 'value');
  if (!reference) return '';
  return resolveReference(xmlDoc, reference) ?? '';
}

/**
 * Formats HL7 v2/v3 style timestamps. Handles partial dates and the optional
 * `+ZZZZ` / `-ZZZZ` offset, rendering the correct instant in local time.
 */
export function formatHl7Date(raw: string | null | undefined): string {
  if (!raw) return 'N/A';

  const trimmed = raw.trim();
  if (/^\d{4}[^\d]/.test(trimmed)) return trimmed;

  const match = trimmed.match(
    /^(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?(?:\.\d+)?(?:([+-])(\d{2})(\d{2}))?/,
  );

  if (!match) return trimmed;

  const [, yearText, monthText, dayText, hourText, minuteText, secondText, sign, offsetHour, offsetMinute] =
    match;

  const year = Number(yearText);
  const month = monthText ? Number(monthText) : 1;
  const day = dayText ? Number(dayText) : 1;
  const hour = hourText ? Number(hourText) : 0;
  const minute = minuteText ? Number(minuteText) : 0;
  const second = secondText ? Number(secondText) : 0;

  if (!hourText) {
    const dateOnly = new Date(year, month - 1, day);
    if (Number.isNaN(dateOnly.getTime())) return trimmed;
    return dateOnly.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  const hasOffset = Boolean(sign && offsetHour);

  const date = hasOffset
    ? new Date(
        Date.UTC(year, month - 1, day, hour, minute, second) -
          (Number(offsetHour) * 60 + Number(offsetMinute ?? '0')) *
            (sign === '-' ? -1 : 1) *
            60_000,
      )
    : new Date(year, month - 1, day, hour, minute, second);

  if (Number.isNaN(date.getTime())) return trimmed;

  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function detectXmlShape(xmlDoc: Document): XmlShape {
  const root = xmlDoc.documentElement;
  if (!root) return 'xml';

  if (findFirst(xmlDoc, 'registryresponse')) return 'registry-response';

  if (tagOf(root) === 'clinicaldocument') return 'clinical-document';

  if (findFirst(xmlDoc, 'provideandregisterdocumentsetrequest')) return 'xds-submission';

  if (extractEmbeddedDocuments(xmlDoc).length > 0) return 'xds-submission';

  return 'xml';
}

/** Decodes every XDS `<Document>` payload that contains base64 XML. */
export function extractEmbeddedDocuments(xmlDoc: Document): Document[] {
  const documents: Document[] = [];

  for (const element of findAll(xmlDoc, 'document')) {
    const payload = textOf(element);
    if (!isBase64Like(payload)) continue;

    const decoded = decodeBase64Utf8(payload);
    if (!decoded || !decoded.trim().startsWith('<')) continue;

    const parsed = parseXml(decoded);
    if (parsed) documents.push(parsed);
  }

  return documents;
}

export interface NameParts {
  given: string;
  family: string;
  full: string;
}

/** Extracts a human readable name from an HL7 `name` element. */
export function readName(nameElement: Element | null | undefined): NameParts {
  if (!nameElement) return { given: '', family: '', full: '' };

  const family = textOf(findFirst(nameElement, 'family'));
  const given = textOf(findFirst(nameElement, 'given'));
  const full = [given, family].filter(Boolean).join(' ') || textOf(nameElement);

  return { given, family, full };
}

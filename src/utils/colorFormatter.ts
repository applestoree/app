/**
 * Formats variant color for iWatch products according to strict specification:
 * Format wajib: Case {warna case} | Strap {warna strap}
 *
 * Rules:
 * - Always use label "Case" for Apple Watch casing color.
 * - Always use label "Strap" for Apple Watch band color.
 * - Separate Case and Strap ONLY with " | ".
 * - Do not use comma, slash (/), or dash (-).
 */
export function formatIWatchColor(rawColor: string): string {
  const parsed = parseIWatchColorParts(rawColor);
  return `Case ${parsed.caseColor} | Strap ${parsed.strapColor}`;
}

export interface IWatchColorParts {
  caseColor: string;
  strapColor: string;
}

export function parseIWatchColorParts(rawColor: string): IWatchColorParts {
  if (!rawColor || typeof rawColor !== 'string') {
    return { caseColor: 'Standard', strapColor: 'Standard' };
  }

  const trimmed = rawColor.trim();

  // If already formatted as "Case ... | Strap ...", parse directly
  const strictPattern = /^Case\s+([^|]+)\s*\|\s*Strap\s+([^|]+)$/i;
  const strictMatch = trimmed.match(strictPattern);
  if (strictMatch) {
    return {
      caseColor: cleanColorName(strictMatch[1]) || 'Standard',
      strapColor: cleanColorName(strictMatch[2]) || 'Standard',
    };
  }

  let caseRaw = '';
  let strapRaw = '';

  // 1. Check if separated by pipe '|'
  if (trimmed.includes('|')) {
    const parts = trimmed.split('|');
    caseRaw = parts[0] || '';
    strapRaw = parts.slice(1).join(' ') || '';
  }
  // 2. Check if separated by slash '/'
  else if (trimmed.includes('/')) {
    const parts = trimmed.split('/');
    caseRaw = parts[0] || '';
    strapRaw = parts.slice(1).join(' ') || '';
  }
  // 3. Check if separated by comma ','
  else if (trimmed.includes(',')) {
    const parts = trimmed.split(',');
    caseRaw = parts[0] || '';
    strapRaw = parts.slice(1).join(' ') || '';
  }
  // 4. Check if separated by hyphen '-' with surrounding spaces
  else if (/\s+-\s+/.test(trimmed)) {
    const parts = trimmed.split(/\s+-\s+/);
    caseRaw = parts[0] || '';
    strapRaw = parts.slice(1).join(' ') || '';
  }
  // 5. Single color value (e.g. "Natural Titanium")
  else {
    caseRaw = trimmed;
    strapRaw = trimmed;
  }

  // Remove existing "Case" or "Strap" prefixes if any
  caseRaw = caseRaw.replace(/^case\s*:?\s*/i, '').trim();
  strapRaw = strapRaw.replace(/^strap\s*:?\s*/i, '').trim();

  const cleanCase = cleanColorName(caseRaw) || 'Standard';
  const cleanStrap = cleanColorName(strapRaw) || cleanCase || 'Standard';

  return {
    caseColor: cleanCase,
    strapColor: cleanStrap,
  };
}

/**
 * Cleans individual color names:
 * Removes forbidden characters (comma, slash, dash, pipe) and collapses whitespace.
 */
export function cleanColorName(name: string): string {
  return name
    .replace(/[,/|\-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Helper to check if a product is iWatch
 */
export function isIWatchProduct(productType?: string, title?: string): boolean {
  if (productType && productType.toLowerCase() === 'iwatch') {
    return true;
  }
  if (productType && productType.toLowerCase().includes('watch')) {
    return true;
  }
  if (title && /apple\s*watch|iwatch/i.test(title)) {
    return true;
  }
  return false;
}

/**
 * Normalizes a product color based on product type
 */
export function normalizeProductColor(rawColor: string, productType?: string, title?: string): string {
  if (isIWatchProduct(productType, title)) {
    return formatIWatchColor(rawColor);
  }
  return rawColor;
}

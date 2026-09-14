const SUPABASE_URL = 'https://jhpbtooefyzdndstlzva.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const BUCKET = 'apple';

function getExtension(file: File) {
  const fromName = file.name.split('.').pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName;
  if (file.type === 'image/jpeg') return 'jpg';
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  return 'bin';
}

function safeSegment(value: string) {
  return value.trim().replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'unknown';
}

export async function uploadProductImage(file: File, itemGroupId: string, color: string, role: 'main' | 'additional') {
  if (!SUPABASE_PUBLISHABLE_KEY) {
    throw new Error('Missing VITE_SUPABASE_PUBLISHABLE_KEY for Supabase Storage upload.');
  }
  if (!file.type.startsWith('image/')) throw new Error('Only image files are allowed.');
  if (file.size > 5 * 1024 * 1024) throw new Error('Image size must not exceed 5 MB.');

  const extension = getExtension(file);
  const filename = `${role}-${crypto.randomUUID()}.${extension}`;
  const path = `products/${safeSegment(itemGroupId)}/${safeSegment(color)}/${filename}`;
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      'Content-Type': file.type || 'application/octet-stream',
      'x-upsert': 'false',
    },
    body: file,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(message || `Image upload failed (${response.status}).`);
  }

  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

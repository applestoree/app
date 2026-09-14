const SUPABASE_URL = 'https://jhpbtooefyzdndstlzva.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpocGJ0b29lZnl6ZG5kc3RsenZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwNjc4NzgsImV4cCI6MjA5ODY0Mzg3OH0.aa8K01S_ITixoxWw73_RZ_upEcBKI6-JFY9WI3YcA-g';
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
  if (!file.type.startsWith('image/')) throw new Error('Only image files are allowed.');
  if (file.size > 5 * 1024 * 1024) throw new Error('Image size must not exceed 5 MB.');

  const extension = getExtension(file);
  const filename = `${role}-${crypto.randomUUID()}.${extension}`;
  const path = `products/${safeSegment(itemGroupId)}/${safeSegment(color)}/${filename}`;
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
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

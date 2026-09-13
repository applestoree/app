export const normalizePhone = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return '';

  let digits = trimmed.replace(/\D/g, '');
  if (digits.startsWith('60')) digits = digits.slice(2);
  else if (digits.startsWith('0')) digits = digits.slice(1);

  return digits ? `+60${digits}` : '';
};

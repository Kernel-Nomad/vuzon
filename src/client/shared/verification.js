const POSITIVE_VERIFICATION_STRINGS = new Set([
  'true', '1', 'yes', 'y', 'active', 'enabled', 'verified', 'verificado',
  'si', 'sí', 'on', 'ok', 'okay', 'approved', 'success', 'successful',
  'complete', 'completed', 'confirmado', 'confirmed', 'valid', 'validado',
]);

const ISO_TIMESTAMP_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/;

function isIsoTimestampString(value) {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  if (!ISO_TIMESTAMP_REGEX.test(trimmed)) {
    return false;
  }

  return !Number.isNaN(Date.parse(trimmed));
}

export function isVerifiedStatus(value) {
  if (value === true || value === 1) {
    return true;
  }

  if (typeof value === 'string') {
    const normalized = value.toLowerCase().trim();

    if (POSITIVE_VERIFICATION_STRINGS.has(normalized)) {
      return true;
    }

    if (isIsoTimestampString(value)) {
      return true;
    }
  }

  if (typeof value === 'object' && value !== null) {
    if (value.status === 'verified') {
      return true;
    }

    if (value.verification_status === 'active') {
      return true;
    }
  }

  return false;
}

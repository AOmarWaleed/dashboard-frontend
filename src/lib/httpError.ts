function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Detects a serialized Axios error. The check is intentionally narrow so that
 * ordinary application JSON with a `config` or `message` field is not mistaken
 * for an HTTP failure.
 */
export function isHttpErrorPayload(value: unknown): value is Record<string, unknown> {
  if (!isRecord(value)) return false;

  const config = value.config;
  if (!isRecord(config)) return false;

  const looksLikeAxios =
    value.name === 'AxiosError' ||
    value.isAxiosError === true ||
    (typeof value.code === 'string' && value.code.startsWith('ERR_'));

  if (!looksLikeAxios) return false;

  return (
    typeof value.message === 'string' ||
    typeof value.status === 'number' ||
    typeof value.status === 'string' ||
    isRecord(value.response)
  );
}

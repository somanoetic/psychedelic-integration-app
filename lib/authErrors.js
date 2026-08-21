// The Supabase auth gateway can return a non-JSON 5xx (e.g. a 504 timeout)
// during email/load bursts; in that case supabase-js stringifies the whole
// Response object into error.message. Never show that to a user — map
// server/timeout errors to a friendly retry message and surface only known,
// actionable auth errors verbatim.
export function friendlyAuthErrorMessage(error) {
  const status = error?.status || error?.statusCode;
  const isServerOrTimeout =
    (typeof status === 'number' && status >= 500) ||
    /timeout|gateway|fetch|network/i.test(error?.message || '');

  if (isServerOrTimeout) {
    return 'We could not reach the server just now. Please wait a moment and try again.';
  }
  return error?.message || 'Something went wrong. Please try again.';
}

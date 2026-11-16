export function parseApiError(error) {
  const res = error.response;
  if (!res) return { message: 'Cannot reach the server. Check your connection.', fields: {} };
  if (res.status === 422) {
    const fields = Object.fromEntries(
      Object.entries(res.data.errors ?? {}).map(([k, msgs]) => [k, msgs[0]]),
    );
    return { message: 'Please fix the highlighted fields.', fields };
  }
  if (res.status === 429) {
    const wait = res.headers?.['retry-after'];
    return { message: `Too many attempts. Try again in ${wait ?? 'a few'} seconds.`, fields: {} };
  }
  if (res.status === 404) return { message: 'Not found.', fields: {} };
  if (res.status === 403) return { message: "You don't have permission to do that.", fields: {} };
  return { message: 'Something went wrong. Please try again.', fields: {} };
}

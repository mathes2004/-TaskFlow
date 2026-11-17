import { describe, expect, it } from 'vitest';
import { parseApiError } from '../utils/apiErrors';

const err = (status, data = {}, headers = {}) => ({ response: { status, data, headers } });

describe('parseApiError', () => {
  it('maps 422 to per-field messages', () => {
    const r = parseApiError(err(422, { errors: { title: ['Required.', 'x'], priority: ['Bad.'] } }));
    expect(r.fields).toEqual({ title: 'Required.', priority: 'Bad.' });
  });
  it('reads Retry-After on 429', () => {
    expect(parseApiError(err(429, {}, { 'retry-after': '42' })).message).toContain('42');
  });
  it('never leaks server details on 500', () => {
    const r = parseApiError(err(500, { message: 'SQLSTATE[HY000] secret', trace: [] }));
    expect(r.message).toBe('Something went wrong. Please try again.');
  });
  it('handles network failure', () => {
    expect(parseApiError({}).message).toMatch(/Cannot reach the server/);
  });
});

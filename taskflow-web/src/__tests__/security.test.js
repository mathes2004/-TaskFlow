// Static guards for guide section 9.8 / 9.1 "Client storage" / 9.9 "Secrets".
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(__dirname, '..');
const files = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (p.includes('__tests__')) return [];
    return statSync(p).isDirectory() ? files(p) : /\.(jsx?|css)$/.test(f) ? [p] : [];
  });
const real = files(SRC).filter((p) => !p.includes('mock'));

describe('frontend security guards', () => {
  it('never injects raw HTML or evaluates strings', () => {
    for (const f of real) {
      const text = readFileSync(f, 'utf8');
      expect(text, f).not.toMatch(/dangerouslySetInnerHTML|\beval\(|new Function\(|\.innerHTML\s*=/);
    }
  });
  it('keeps nothing in web storage', () => {
    for (const f of real) expect(readFileSync(f, 'utf8'), f).not.toMatch(/localStorage|sessionStorage/);
  });
  it('uses no inline style attributes (CSP style-src self)', () => {
    for (const f of real.filter((p) => p.endsWith('.jsx'))) expect(readFileSync(f, 'utf8'), f).not.toMatch(/style=\{\{/);
  });
  it('production env holds only the public API URL', () => {
    const env = readFileSync(join(SRC, '..', '.env.production'), 'utf8');
    expect(env).toMatch(/VITE_API_URL=https:\/\//);
    expect(env).not.toMatch(/SECRET|PASSWORD|KEY|TOKEN/i);
    expect(env).toMatch(/VITE_USE_MOCK=false/);
  });
});

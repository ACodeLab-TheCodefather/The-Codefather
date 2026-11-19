import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_THEME_ID,
  OFFICIAL_THEMES,
  computeThemeTokens,
  contrastRatio,
  pickReadableText
} from './themes.ts';

test('OFFICIAL_THEMES contains exactly 20 approved themes with 4 HEX colors each', () => {
  assert.equal(OFFICIAL_THEMES.length, 20);
  const seenIds = new Set<string>();
  for (const theme of OFFICIAL_THEMES) {
    assert.ok(!seenIds.has(theme.id), `Duplicate theme id: ${theme.id}`);
    seenIds.add(theme.id);
    assert.equal(theme.colors.length, 4);
    for (const hex of theme.colors) {
      assert.match(hex, /^#[0-9A-F]{6}$/);
    }
  }
});

test('Dark Techn is the default theme with exact official HEX codes', () => {
  const tokens = computeThemeTokens(DEFAULT_THEME_ID);
  assert.equal(tokens.theme.name, 'Dark Techn');
  assert.deepEqual(tokens.theme.colors, ['#2C2C2C', '#4A4A4A', '#7B2CBF', '#00A8FF']);
  assert.equal(tokens.bg, '#2C2C2C');
  assert.equal(tokens.isDark, true);
});

test('Light themes such as Minimal Light and Pastel Pink get dark readable text', () => {
  assert.equal(pickReadableText('#FFFFFF'), '#111111');
  assert.equal(pickReadableText('#FFB6C1'), '#111111');
  const minimalLight = computeThemeTokens('minimal-light');
  assert.equal(minimalLight.text, '#111111');
  assert.equal(minimalLight.isDark, false);
  assert.ok(contrastRatio(minimalLight.bg, minimalLight.text) >= 12);
});

test('All 20 themes achieve strong primary text contrast >= 4.5:1', () => {
  for (const theme of OFFICIAL_THEMES) {
    const tokens = computeThemeTokens(theme.id);
    const ratio = contrastRatio(tokens.bg, tokens.text);
    assert.ok(
      ratio >= 4.5,
      `Theme ${theme.name} contrast ratio ${ratio.toFixed(2)} is below 4.5:1`
    );
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { UI_STRINGS, getLocalizedText, isTranslationMissing } from './i18n.ts';

test('Arabic and English UI dictionaries share identical keys', () => {
  const arKeys = Object.keys(UI_STRINGS.ar).sort();
  const enKeys = Object.keys(UI_STRINGS.en).sort();
  assert.deepEqual(arKeys, enKeys);
});

test('getLocalizedText respects active language and falls back cleanly without inventing text', () => {
  const entry = { ar: 'مشروع ويب', en: 'Web Project' };
  assert.equal(getLocalizedText(entry, 'ar'), 'مشروع ويب');
  assert.equal(getLocalizedText(entry, 'en'), 'Web Project');

  const missingAr = { ar: '', en: 'Only English' };
  assert.equal(isTranslationMissing(missingAr, 'ar'), true);
  assert.equal(isTranslationMissing(missingAr, 'en'), false);
  assert.equal(getLocalizedText(missingAr, 'ar'), 'Only English');
});

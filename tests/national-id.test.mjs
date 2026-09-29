import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fullNationalId, isNationalId, CAMPAIGN_PATIENT_PATH, safeDecode } from '../src/lib/national-id.ts';

test('Persian digits and lost zeros fold to the ten-digit id', () => {
  assert.equal(fullNationalId('۰۰۱۲۳۴۵۶۷۸'), '0012345678');
  assert.equal(fullNationalId('12345678'), '0012345678');
  assert.equal(fullNationalId(12345678), '0012345678');
  assert.equal(fullNationalId(' 0012345678 '), '0012345678');
});

test('anything else stays invalid', () => {
  assert.equal(isNationalId(fullNationalId('abc')), false);
  assert.equal(isNationalId(fullNationalId('1234567')), false);
  assert.equal(isNationalId(fullNationalId('')), false);
  assert.equal(isNationalId(fullNationalId(null)), false);
});

test('letters are never stripped into someone else\'s id', () => {
  assert.equal(fullNationalId('12345678A'), '12345678A');
  assert.equal(isNationalId(fullNationalId('12345678A')), false);
  assert.equal(fullNationalId('001-234-5678'), '0012345678');
});

test('invisible bidi and zero-width marks from Persian copy-paste fold away', () => {
  assert.equal(fullNationalId('‏0012345678'), '0012345678');
  assert.equal(fullNationalId('‎۱۲۳۴۵۶۷۸'), '0012345678');
});

test('campaign patient path uses the folded id', () => {
  assert.equal(CAMPAIGN_PATIENT_PATH(3, '۱۲۳۴۵۶۷۸'), '/console/monitorings/3/patients/0012345678');
});

test('a non-numeric folded id is escaped in the path', () => {
  assert.equal(CAMPAIGN_PATIENT_PATH(3, '12/34'), '/console/monitorings/3/patients/12%2F34');
});

test('safeDecode: a malformed escape stays invalid instead of throwing', () => {
  assert.equal(safeDecode('0012345678'), '0012345678');
  assert.equal(safeDecode('%DB%B0%DB%B0%DB%B1%DB%B2%DB%B3%DB%B4%DB%B5%DB%B6%DB%B7%DB%B8'), '۰۰۱۲۳۴۵۶۷۸');
  assert.doesNotThrow(() => safeDecode('0012%E0%A4%A'));
  assert.equal(isNationalId(fullNationalId(safeDecode('0012%E0%A4%A'))), false);
  assert.equal(isNationalId(fullNationalId(safeDecode('0012345678%'))), false);
});

test('a search finds an id stored without its leading zero', async () => {
  const { nationalIdMatches } = await import('../src/lib/national-id.ts');
  // Older uploads hold ids as numbers: 0850157269 was stored as 850157269.
  for (const stored of [850157269, '850157269', '0850157269']) {
    assert.equal(nationalIdMatches(stored, '0850157269'), true, `full id vs ${stored}`);
    assert.equal(nationalIdMatches(stored, '085015'), true, `leading part vs ${stored}`);
    assert.equal(nationalIdMatches(stored, '850157'), true, `without the zero vs ${stored}`);
    assert.equal(nationalIdMatches(stored, '۰۸۵۰۱۵۷۲۶۹'), true, `Persian digits vs ${stored}`);
    assert.equal(nationalIdMatches(stored, '٠٨٥٠١٥٧٢٦٩'), true, `Arabic-Indic digits vs ${stored}`);
    assert.equal(nationalIdMatches(stored, ' 0850 157269‏'), true, `spaces and marks vs ${stored}`);
  }
});

test('a search does not match other ids, names or empty input', async () => {
  const { nationalIdMatches } = await import('../src/lib/national-id.ts');
  assert.equal(nationalIdMatches('0850157269', '0850157268'), false);
  assert.equal(nationalIdMatches('0850157269', 'علی'), false);
  assert.equal(nationalIdMatches('0850157269', ''), false);
  assert.equal(nationalIdMatches(null, '0850'), false);
});

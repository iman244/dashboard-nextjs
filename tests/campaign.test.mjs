import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findNationalIdColumn, campaignUploads, pickUpload, rowMatches } from '../src/lib/campaign.ts';

const up = (id, type, day) => ({ id, type, created_at: `2026-09-${day}T00:00:00Z`, name: String(id) });

test('uploads of one campaign, newest first', () => {
  const all = [up(1, 'step_2', '01'), up(2, 'step_1', '02'), up(3, 'step_2', '03')];
  assert.deepEqual(campaignUploads(all, 'step_2').map(u => u.id), [3, 1]);
});

test('pickUpload keeps a valid request, else falls back to the newest', () => {
  const list = [up(3, 'step_2', '03'), up(1, 'step_2', '01')];
  assert.deepEqual(pickUpload(list, '1'), { selected: list[1], requestedMissing: false });
  assert.deepEqual(pickUpload(list, '99'), { selected: list[0], requestedMissing: true });
  assert.deepEqual(pickUpload(list, null), { selected: list[0], requestedMissing: false });
  assert.deepEqual(pickUpload([], '1'), { selected: undefined, requestedMissing: true });
});

test('national id column: known names first, then any "کد ملی" column, else none', () => {
  assert.equal(findNationalIdColumn([{ 'کد ملی': '1' }]), 'کد ملی');
  assert.equal(findNationalIdColumn([{ a: 1 }, { 'personel.کد ملی': '1' }]), 'personel.کد ملی');
  assert.equal(findNationalIdColumn([{ 'کد ملی همسر': '1' }]), 'کد ملی همسر');
  assert.equal(findNationalIdColumn([{ name: 'x' }]), undefined);
  assert.equal(findNationalIdColumn([]), undefined);
});

test('row search matches any cell, with Persian digits folded', () => {
  const row = { name: 'Ali Rezaei', id: 12345678 };
  assert.equal(rowMatches(row, 'rez'), true);
  assert.equal(rowMatches(row, '۱۲۳۴'), true);
  assert.equal(rowMatches(row, 'sara'), false);
  assert.equal(rowMatches(row, '  '), true);
});

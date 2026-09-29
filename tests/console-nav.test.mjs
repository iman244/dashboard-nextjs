import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONSOLE_NAV_ITEMS, isConsoleNavItemActive } from '../src/app/[locale]/(authenticated)/console/_nav/items.ts';

const activeKeys = (pathname) =>
  CONSOLE_NAV_ITEMS.filter((item) => isConsoleNavItemActive(item, pathname)).map((item) => item.titleKey);

test('most-specific-wins: upload owns only uploadExcel, not the campaign list', () => {
  assert.deepEqual(activeKeys('/console/monitorings/upload'), ['uploadExcel']);
});

test('most-specific-wins: a records path owns only recordMonitoring, not the campaign list', () => {
  assert.deepEqual(activeKeys('/console/monitorings/3/records/new'), ['recordMonitoring']);
});

test('most-specific-wins: any other campaign path falls back to the campaign list', () => {
  assert.deepEqual(activeKeys('/console/monitorings/3'), ['campaigns']);
});

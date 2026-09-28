import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createTranslator } from 'use-intl/core';

// Counts are passed as numbers: English picks its plural form, and Persian
// formats the digits itself. A pre-formatted string read "1 Excel uploads".
const load = (locale) => JSON.parse(readFileSync(new URL(`../messages/${locale}.json`, import.meta.url), 'utf8'));
const translator = (locale, namespace) => createTranslator({ locale, messages: load(locale), namespace });

test('campaign list counts agree with their number', () => {
  const en = translator('en', '/console/monitorings.MonitoringTypesPage');
  assert.equal(en('counts', { uploads: 1, records: 1 }), '1 Excel upload · 1 record');
  assert.equal(en('counts', { uploads: 0, records: 2 }), '0 Excel uploads · 2 records');
  const fa = translator('fa', '/console/monitorings.MonitoringTypesPage');
  assert.equal(fa('counts', { uploads: 1, records: 12 }), '۱ اکسل · ۱۲ اطلاعات ثبت‌شده');
});

test('row count agrees with its number', () => {
  const en = translator('en', '/console/monitorings.Campaign');
  assert.equal(en('rowCount', { shown: 1, total: 1 }), '1 of 1 row');
  assert.equal(en('rowCount', { shown: 1, total: 3 }), '1 of 3 rows');
  const fa = translator('fa', '/console/monitorings.Campaign');
  assert.equal(fa('rowCount', { shown: 1, total: 3 }), '۱ از ۳ ردیف');
});

test('upload warnings count agrees with its number', () => {
  const en = translator('en', '/console/saderat-bank-health-monitoring.UploadSaderatBankHealthMonitoringExcelDialog');
  assert.equal(en('savedWithIssues', { count: 1 }), 'Uploaded. 1 thing to check:');
  assert.equal(en('savedWithIssues', { count: 2 }), 'Uploaded. 2 things to check:');
  const fa = translator('fa', '/console/saderat-bank-health-monitoring.UploadSaderatBankHealthMonitoringExcelDialog');
  assert.equal(fa('savedWithIssues', { count: 2 }), 'بارگذاری شد. ۲ مورد برای بررسی:');
});

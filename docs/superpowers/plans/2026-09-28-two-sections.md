# Two Sections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the console into two sections: Health record (patient search, periodic reports, patient page with EHR tabs) and Monitorings (campaign list, campaign page, patient-in-campaign page, staff tools). Also open monitoring data to every console user for reading.

**Architecture:** A campaign is the existing `MonitoringType`; Excel uploads (`SaderatBankHealthMonitoring`) and form records (`PatientEntry`) already point at it, so there is no migration. Django gains a read/write permission split, campaign counts, an upload column check and per-campaign person rows. Next.js reuses the existing Step 1 / Step 2 report and person views as components, mounted inside new campaign routes. Old routes become redirects.

**Tech Stack:**
- Django 5.2 + DRF + drf-spectacular (tests: `manage.py test` on Postgres).
- Next.js 16 app router, next-intl (fa/en), TanStack Query, Radix (`radix-ui`), Tailwind.
- Pure helpers are tested with `node --test --experimental-strip-types`.

**Spec:** `docs/superpowers/specs/2026-09-28-two-sections-design.md` (read it first).

**Repos and branches:**
- `D` = `/Users/iman244/Repositories/mainreport/dashboard-django-app-journeys`. Branch `feat/two-sections`, created from `feat/person-reports`.
- `N` = `/Users/iman244/Repositories/mainreport/dashboard-nextjs-app-journeys`. Branch `feat/two-sections`, already checked out.
- `C` = `N/src/app/[locale]/(authenticated)/console`.

**Running things locally:**
- Postgres: `docker start mainreport-walkthrough-pg` (port 55432).
- Django env, set before any `manage.py` command:
  - `export PYTHONPATH=/Users/iman244/Repositories/mainreport/.claude/dev DJANGO_SETTINGS_MODULE=walk_settings`
  - `/Users/iman244/Repositories/mainreport/.claude/dev/walk_settings.py` imports development settings and sets `DATABASES["default"]["PORT"]="55432"`.
  - Python is `../dashboard-django/venv/bin/python`.
- Django server: `runserver 127.0.0.1:8001`. Next dev server: `npm run dev -- -p 3000` in `N`.
- Browser checks: `require()` the cached playwright at `/Users/iman244/.npm/_npx/9833c18b2d85bc59/node_modules/playwright`, launch with `{ channel: "chrome", headless: true }`, always in a **fresh context** (the default profile autofills saved logins).
- Accounts: `walk_staff` / `walkpass123` (staff), `walk_viewer` / `walkpass123` (viewer). Patient `0012345678` has password `8A6cfr-qOBC308CdR2ZIKlskJKMZaNoU`.

## Global Constraints

- Every user-facing string goes in both `N/messages/en.json` and `N/messages/fa.json`; `node scripts/check-messages.mjs` must print `every key resolves in both catalogues`.
- RTL: use logical classes (`ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-`). A chevron that means "onward" gets `rtl:rotate-180`.
- Digits shown to users go through `localeDigits(value, locale)`; dates through `formatDate(date, locale)`.
- A changed file must not gain ESLint problems. Compare with `git show HEAD:<f> | npx eslint --stdin --stdin-filename <f>` against `npx eslint <f>`. `npx tsc --noEmit` must exit 0.
- Staff-only actions are hidden with `useIsStaff()`, and staff-only routes keep `<StaffOnly>`. Django enforces the same rule.
- Pages over dialogs for substantial forms.
- `step_1` and `step_2` slugs must not change: routes and chart layouts key on them.
- Commit messages end with `Co-Authored-By: Claude <noreply@anthropic.com>`.

## Review Focus

(Six lines: the upload feedback rule the user added on 2026-09-28 earns its own.)

1. **A national ID typed with Persian digits or missing leading zeros** (`۰۰۱۲۳۴۵۶۷۸`, `12345678`) in any new route or box must open the same patient as `0012345678`. Pinned in Task 6 (`tests/national-id.test.mjs`) and Task 18 (browser).
2. **A campaign with no uploads, no records, or an upload with zero rows** must show an empty state, never a blank area or a crash. Pinned in Task 6 (`pickUpload([])`) and Task 11 (browser).
3. **`?upload=` naming an upload that belongs to another campaign or was deleted** must fall back to the newest upload of this campaign, with a notice. Pinned in Task 6 (`pickUpload` tests) and Task 11.
4. **A viewer opening a staff route by URL, or a patient account calling any console endpoint**: the viewer sees "Staff access required" and no write controls; the patient gets 403. Pinned in Task 1 (Django tests) and Task 8/11 (browser).
5. **An upload for a campaign without a chart layout that has no national-ID column** must still render as a table, with rows that are not links, and the uploader is told why. Pinned in Task 3 (`no_id_column`), Task 6 (`findNationalIdColumn`) and Task 10.
6. **A messy spreadsheet** (dates, numbers, blank or letter-bearing IDs, duplicates, missing columns, no rows) is saved as text, and each problem is listed by Excel row. Only an unreadable file is refused, and it says why. Charts still read numbers from the text. Pinned in Task 3 (Django tests), Task 3b (`toNumber`, text-only Step 1 upload) and Task 9 (browser, fa and en).

---

## Slice 1: Django

### Task 1: Read for console users, write for staff

**Files:**
- Modify: `D/saderatBankHealthMonitoring/views.py` (add `IsConsoleReader` after `IsClinicalStaff` at line 41; change `permission_classes` at lines 69, 99, 155, 279, 322)
- Create: `D/saderatBankHealthMonitoring/test_console_read.py`
- Modify tests that asserted viewer read denial:
  - `D/saderatBankHealthMonitoring/tests.py` (`test_member_cannot_read_types` near line 58, `test_member_cannot_list_or_read` near line 1097)
  - `D/saderatBankHealthMonitoring/test_patient_access.py` (`test_unprofiled_account_cannot_read_general_endpoints`, lines 10-15)
  - `D/saderatBankHealthMonitoring/test_person_reports.py` (`test_staff_only`, lines 86-92)

**Interfaces:**
- Produces: `IsConsoleReader` permission class. Safe methods are allowed for an authenticated user without `patient_identity`; anything else additionally requires `is_staff`.

- [ ] **Step 1: Create the branch**

```bash
cd D && git switch feat/person-reports && git switch -c feat/two-sections
```

- [ ] **Step 2: Write the failing tests** in `D/saderatBankHealthMonitoring/test_console_read.py`:

```python
from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework.test import APITestCase

from .models import MonitoringType, PatientEntry, PatientIdentity, SaderatBankHealthMonitoring

API = '/api/saderat-bank-health-monitoring/'


class ConsoleReadAccessTests(APITestCase):
    """Any signed-in console user reads; staff write; patients only use /me/."""

    @classmethod
    def setUpTestData(cls):
        step_2 = MonitoringType.objects.get(slug='step_2')
        cls.upload = SaderatBankHealthMonitoring.objects.create(
            name='Mehr', type=step_2, json=[{'کد ملی': '0012345678'}])
        cls.entry = PatientEntry.objects.create(
            monitoring=step_2, national_id='0012345678', values={})
        User = get_user_model()
        cls.viewer = User.objects.create_user('viewer', password='pw')
        cls.patient = User.objects.create_user('patient', password='pw')
        PatientIdentity.objects.create(user=cls.patient, national_id='0012345678')

    def setUp(self):
        cache.clear()

    def reads(self):
        return [
            'monitoring-types/',
            f'monitoring-types/{self.upload.type_id}/',
            'monitorings/',
            f'monitorings/{self.upload.id}/',
            'patient-entries/',
            f'patient-entries/{self.entry.id}/',
            'patient-records/?national_id=0012345678',
            'person-reports/?national_id=0012345678',
        ]

    def test_viewer_reads_every_console_endpoint(self):
        self.client.force_authenticate(self.viewer)
        for endpoint in self.reads():
            with self.subTest(endpoint=endpoint):
                self.assertEqual(self.client.get(API + endpoint).status_code, 200)

    def test_viewer_cannot_write(self):
        self.client.force_authenticate(self.viewer)
        writes = [
            ('post', 'monitoring-types/', {'slug': 'x', 'name_en': 'X', 'name_fa': 'X'}),
            ('patch', f'monitoring-types/{self.upload.type_id}/', {'name_en': 'Y'}),
            ('delete', f'monitorings/{self.upload.id}/', None),
            ('post', 'monitorings/upload_excel/', {}),
            ('post', 'patient-entries/', {}),
            ('patch', f'patient-entries/{self.entry.id}/', {'values': {}}),
            ('delete', f'patient-entries/{self.entry.id}/', None),
            ('post', 'patient-entries/presign/', {}),
        ]
        for method, endpoint, body in writes:
            with self.subTest(method=method, endpoint=endpoint):
                response = getattr(self.client, method)(API + endpoint, body, format='json')
                self.assertEqual(response.status_code, 403)

    def test_patient_account_is_refused_everywhere_but_me(self):
        self.client.force_authenticate(self.patient)
        for endpoint in self.reads():
            with self.subTest(endpoint=endpoint):
                self.assertEqual(self.client.get(API + endpoint).status_code, 403)
        self.assertEqual(self.client.get(API + 'patient-records/me/').status_code, 200)

    def test_anonymous_is_unauthorized(self):
        for endpoint in self.reads():
            with self.subTest(endpoint=endpoint):
                self.assertEqual(self.client.get(API + endpoint).status_code, 401)
```

- [ ] **Step 3: Run it to verify it fails**

Run: `cd D && ../dashboard-django/venv/bin/python manage.py test saderatBankHealthMonitoring.test_console_read --noinput`
Expected: FAIL. `test_viewer_reads_every_console_endpoint` gets 403.

- [ ] **Step 4: Add the permission** in `views.py`, directly after `class IsClinicalStaff`:

```python
class IsConsoleReader(permissions.BasePermission):
    """Any signed-in console user reads; only clinical staff write.

    Patient accounts are refused outright: their only door is
    patient-records/me/, which has its own permission.
    """

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if hasattr(user, 'patient_identity'):
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(user.is_staff)
```

Then set `permission_classes = [IsConsoleReader]` on `MonitoringTypeViewSet`, `SaderatBankHealthMonitoringViewSet`, `PatientEntryViewSet`, `PatientRecordsView` and `PersonReportsView`. Leave `OwnPatientRecordsView` unchanged.

- [ ] **Step 5: Flip the old read-denial tests to the new rule**
  - `tests.py` `test_member_cannot_read_types`: rename to `test_member_reads_types` and assert `200`.
  - `tests.py` `test_member_cannot_list_or_read`: rename to `test_member_can_list_and_read` and assert `200` for both `listed` and `one`.
  - `test_patient_access.py` `test_unprofiled_account_cannot_read_general_endpoints`: rename to `test_unprofiled_account_reads_general_endpoints` and assert `200` for each endpoint.
  - `test_person_reports.py` `test_staff_only`: replace its body with:

```python
    def test_console_users_read_patients_do_not(self):
        self.assertEqual(self.get().status_code, status.HTTP_401_UNAUTHORIZED)
        self.client.force_authenticate(self.viewer)
        self.assertEqual(self.get().status_code, status.HTTP_200_OK)
        self.client.force_authenticate(self.patient)
        self.assertEqual(self.get().status_code, status.HTTP_403_FORBIDDEN)
```

- [ ] **Step 6: Run the whole suite**

Run: `cd D && ../dashboard-django/venv/bin/python manage.py test --noinput`
Expected: `OK`. Every test that still expects 403 involves a patient identity or a write.

- [ ] **Step 7: Commit**

```bash
cd D && git add saderatBankHealthMonitoring && git commit -m "feat: console users read monitoring data; staff write; patients refused

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Task 2: Campaign counts

**Files:**
- Modify: `D/saderatBankHealthMonitoring/serializers.py` (`MonitoringTypeSerializer`, lines 43-46)
- Modify: `D/saderatBankHealthMonitoring/views.py` (`MonitoringTypeViewSet.get_queryset`)
- Test: `D/saderatBankHealthMonitoring/test_console_read.py` (new class)

**Interfaces:**
- Produces: `MonitoringType` responses gain read-only `upload_count: int` and `record_count: int`.

- [ ] **Step 1: Write the failing test** (append to `test_console_read.py`):

```python
class CampaignCountTests(APITestCase):
    def test_types_carry_upload_and_record_counts(self):
        step_2 = MonitoringType.objects.get(slug='step_2')
        SaderatBankHealthMonitoring.objects.create(name='A', type=step_2, json=[])
        SaderatBankHealthMonitoring.objects.create(name='B', type=step_2, json=[])
        PatientEntry.objects.create(monitoring=step_2, national_id='0012345678', values={})
        viewer = get_user_model().objects.create_user('v2', password='pw')
        self.client.force_authenticate(viewer)
        rows = {r['slug']: r for r in self.client.get(API + 'monitoring-types/').data}
        self.assertEqual(rows['step_2']['upload_count'], 2)
        self.assertEqual(rows['step_2']['record_count'], 1)
        self.assertEqual(rows['step_1']['upload_count'], 0)
        one = self.client.get(API + f'monitoring-types/{step_2.id}/').data
        self.assertEqual(one['upload_count'], 2)
```

- [ ] **Step 2: Run it to verify it fails**

Run: `../dashboard-django/venv/bin/python manage.py test saderatBankHealthMonitoring.test_console_read.CampaignCountTests --noinput`
Expected: FAIL with `KeyError: 'upload_count'`.

- [ ] **Step 3: Implement.** In `serializers.py`:

```python
class MonitoringTypeSerializer(serializers.ModelSerializer):
    # Annotated by MonitoringTypeViewSet.get_queryset; absent on a freshly
    # created instance, hence the defaults.
    upload_count = serializers.IntegerField(read_only=True, default=0)
    record_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = MonitoringType
        fields = ['id', 'slug', 'name_en', 'name_fa', 'field_schema',
                  'upload_count', 'record_count']
```

In `views.py`, add to `MonitoringTypeViewSet` (and import `Count` from `django.db.models`):

```python
    def get_queryset(self):
        # distinct=True: two joins in one query would otherwise multiply.
        return MonitoringType.objects.annotate(
            upload_count=Count('monitorings', distinct=True),
            record_count=Count('entries', distinct=True),
        ).order_by('id')
```

(`monitorings` is the `related_name` of `SaderatBankHealthMonitoring.type`, the same one `destroy` uses; `entries` is the `related_name` of `PatientEntry.monitoring`.)

- [ ] **Step 4: Run the suite.** `manage.py test --noinput`. Expected: `OK`.

- [ ] **Step 5: Commit** `feat: monitoring types report upload and record counts`

### Task 3: Upload saves every readable file as text, and lists what to check

User rules (2026-09-28):
- **Every cell is stored as text.** A component converts to a number only where it needs one (Task 3b); the upload never cares about types.
- **Save whenever possible.** The only refusal is a file that cannot be read at all, because then there is nothing to save. Everything else is saved, and anything that will limit what the pages can show is listed as a warning with Excel row numbers.
- The API returns **codes plus details, not sentences**, so the upload page can say it in Persian or English.

What each warning means for the pages (from the 2026-09-28 code read):
- **No data rows:** the upload shows its empty state.
- **A charted monitoring missing its national-ID column:** charts still work, but no one can be opened.
- **Blank, non-10-digit or duplicate IDs:** those rows can't be opened, or a duplicate shows several rows.
- **Missing chart columns:** those charts are empty.
- **Reading every cell as text also removes the date crash** (a date cell used to make the save fail with a 500).

**Files:**
- Create: `D/saderatBankHealthMonitoring/layouts.py`, `D/saderatBankHealthMonitoring/upload_checks.py`
- Modify: `D/saderatBankHealthMonitoring/serializers.py` (upload `create`)
- Modify: `D/saderatBankHealthMonitoring/views.py` (`upload_excel` returns `{message, id, issues}`; the `inline_serializer` gains `id` and `issues`)
- Test: `D/saderatBankHealthMonitoring/test_upload_checks.py`

**Interfaces:**
- Produces:
  - An issue is a dict `{"level": "error"|"warning", "code": str, ...details}`. `unreadable` is the only error; every other code is a warning. Codes and details:
    - `unreadable {detail}`
    - `no_rows {}`
    - `missing_id_column {column, found: [str], looks_like?: slug}`
    - `no_id_column {}`
    - `blank_ids {count, rows: [int]}`
    - `invalid_ids {count, rows: [{row, value}]}`
    - `duplicate_ids {count, groups: [{value, rows: [int]}]}`
    - `missing_columns {columns: [str]}`
  - Row numbers are Excel row numbers (header = row 1, so the first data row is 2). Lists are capped at 20 entries, and `count` carries the full total.
  - An unreadable file returns `400 {"file": ["The file could not be read."], "issues": [unreadable]}`.
  - A saved upload returns `200 {"message": "...", "id": int, "issues": [warnings]}`.

- [ ] **Step 1: Write the failing tests** in `test_upload_checks.py`:

```python
import io
from datetime import datetime

import pandas as pd
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase

from .models import MonitoringType, SaderatBankHealthMonitoring
from .tests import excel_upload

STEP_2_ROW = {'کد ملی': '0012345678', 'نام': 'Ali', 'علائم عمومي': 'x'}


def codes(issues):
    return {issue['code']: issue for issue in issues}


class UploadChecksTests(APITestCase):
    def setUp(self):
        staff = get_user_model().objects.create_user('op', password='pw', is_staff=True)
        self.client.force_authenticate(staff)

    def upload(self, slug, file, name='Sheet'):
        return self.client.post(reverse('monitorings-upload-excel'),
                                {'name': name, 'type': slug, 'file': file}, format='multipart')

    def test_every_cell_is_stored_as_text(self):
        row = {**STEP_2_ROW, 'تاریخ': datetime(2026, 9, 1), 'Heart rate:': 70, 'BMI': 24.5}
        response = self.upload('step_2', excel_upload([row]))
        self.assertEqual(response.status_code, 200)
        stored = SaderatBankHealthMonitoring.objects.get(id=response.data['id']).json[0]
        self.assertTrue(stored['تاریخ'].startswith('2026-09-01'))
        self.assertEqual(stored['Heart rate:'], '70')
        self.assertEqual(stored['BMI'], '24.5')
        self.assertIsNone({**stored, 'x': None}['x'])

    def test_empty_cells_stay_null_not_the_text_nan(self):
        response = self.upload('step_2', excel_upload([{**STEP_2_ROW, 'Respiratory rate': None}]))
        stored = SaderatBankHealthMonitoring.objects.get(id=response.data['id']).json[0]
        self.assertIsNone(stored['Respiratory rate'])

    def test_layout_file_without_its_id_column_is_saved_with_details(self):
        response = self.upload('step_1', excel_upload([STEP_2_ROW]))
        self.assertEqual(response.status_code, 200)
        issue = codes(response.data['issues'])['missing_id_column']
        self.assertEqual(issue['level'], 'warning')
        self.assertEqual(issue['column'], 'personel.کد ملی')
        self.assertIn('کد ملی', issue['found'])
        self.assertEqual(issue['looks_like'], 'step_2')

    def test_empty_sheet_is_saved_with_a_warning(self):
        response = self.upload('step_2', excel_upload([]))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(codes(response.data['issues'])['no_rows']['level'], 'warning')

    def test_unreadable_file_is_the_only_refusal(self):
        bad = io.BytesIO(b'not a spreadsheet'); bad.name = 'report.xlsx'
        response = self.upload('step_2', bad)
        self.assertEqual(response.status_code, 400)
        issue = codes(response.data['issues'])['unreadable']
        self.assertEqual(issue['level'], 'error')
        self.assertTrue(issue['detail'])

    def test_bad_ids_are_saved_and_listed_by_excel_row(self):
        rows = [STEP_2_ROW, {**STEP_2_ROW, 'کد ملی': None}, {**STEP_2_ROW, 'کد ملی': 'AB12'}, STEP_2_ROW]
        response = self.upload('step_2', excel_upload(rows))
        self.assertEqual(response.status_code, 200)
        found = codes(response.data['issues'])
        self.assertEqual(found['blank_ids']['rows'], [3])
        self.assertEqual(found['invalid_ids']['rows'], [{'row': 4, 'value': 'AB12'}])
        self.assertEqual(found['duplicate_ids']['groups'], [{'value': '0012345678', 'rows': [2, 5]}])
        self.assertIn('Heart rate:', found['missing_columns']['columns'])
        self.assertTrue(all(issue['level'] == 'warning' for issue in response.data['issues']))

    def test_campaign_without_layout_warns_when_rows_cannot_be_linked(self):
        MonitoringType.objects.create(slug='bp', name_en='BP', name_fa='فشار')
        response = self.upload('bp', excel_upload([{'anything': 1}]))
        self.assertEqual(response.status_code, 200)
        self.assertIn('no_id_column', codes(response.data['issues']))

    def test_clean_sheet_has_no_id_warnings(self):
        response = self.upload('step_2', excel_upload([STEP_2_ROW]))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(set(codes(response.data['issues'])), {'missing_columns'})
```

- [ ] **Step 2: Run to verify they fail.** `manage.py test saderatBankHealthMonitoring.test_upload_checks --noinput`. Expected: FAIL (a 500 on the date cell, numbers stored as numbers, and `KeyError: 'issues'`).

- [ ] **Step 3: `layouts.py`.** These columns are copied from the chart code; keep them in step with `C/saderat-bank-health-monitoring/step-1/[id]/page.tsx` (its `countValues`/`numericStats`/`categorizeNumeric` calls) and `C/saderat-bank-health-monitoring/step-2/[id]/_charts/config.ts`.

```python
"""What each charted monitoring's spreadsheet is read for.

`id_column` is required: without it no one in the file can be opened.
`chart_columns` only feed charts; a missing one leaves that chart empty,
so it is reported, never refused.
"""

LAYOUTS = {
    'step_1': {
        'id_column': 'personel.کد ملی',
        'chart_columns': (
            'Alkaline Phosphatase', 'BMI', 'BMI_Group', 'BP_Group', 'CBC/Hb', 'CBC/Hct',
            'CBC/MCH', 'CBC/MCHC', 'CBC/MCV', 'CBC/Plat', 'CBC/RBC', 'CBC/WBC', 'Cr', 'FBS',
            'Ferritin', 'HDL', 'Hb-A1C', 'K', 'LDL', 'Na', 'P', 'PSA', 'SGOT(AST)', 'SGPT(ALT)',
            'T3', 'T4', 'TG', 'TSH', 'Total Chol', 'U_A/Bact', 'U_A/Blood', 'U_A/Glu',
            'U_A/Ketone', 'U_A/Prot', 'U_A/RBC', 'U_A/WBC', 'U_A/crystal', 'Urea', 'Vit D',
            'bilirubin-direct', 'ca', 'name_goroh', 'vitamin b12', 'اندوکرینولوژی', 'بيمه',
            'بیماریهای عضلانی قلب', 'تفسیر الکتروکاردیوگرام', 'تناسلی مردان', 'جنسیت',
            'رادیوگرافی قفسه سینه', 'روماتولوژی', 'سایکولوژی', 'ستون فقرات پشتی و کمری',
            'سر و گردن', 'سن', 'سونوگرافی شکم و لگن', 'سیستم تنفسی', 'قلب', 'مشاوره قلب',
            'معاینات بالینی زنان', 'معاینه بالینی ENT', 'نام صنعت', 'نبض', 'نورولوژی',
            'هماتولوژی', 'پاپ اسمیر', 'پستان', 'گوارش',
        ),
    },
    'step_2': {
        'id_column': 'کد ملی',
        'chart_columns': (
            'Heart rate:', 'Respiratory rate', 'آزمایشات تکمیلی مورد نیاز',
            'آيا دارو خاصي مصرف مي كنيد؟ذكرنماييد.',
            'آيا سابقه بيماري ارثي درخانواده داريد ؟نام  ببريد.',
            'آيا سابقه عمل جراحي داريد ؟ذكر نمايد.', 'آيا سيگارميكشيد؟', 'اندوكرينولوژي',
            'جنسیت', 'روماتولوژي', 'ستون فقرات پشتی و کمری', 'سر و گردن', 'سيستم تنفسي',
            'سيستم عضلاني اسكلتي تحتاني', 'سيستم عضلاني اسكلتي فوقان', 'علائم عمومي',
            'عوامل  رواني', 'عوامل ارگونوميك', 'قلب', 'نورولوژی', 'هماتولوژي', 'پستان',
            'پوست و  مو', 'گوارش',
        ),
    },
}
```

- [ ] **Step 4: `upload_checks.py`**

```python
"""Turn a parsed sheet into warnings a person can act on.

Nothing here stops an upload: a readable sheet is always saved. Row
numbers are Excel's: row 1 holds the headers, so the first data row is 2.
"""
from collections import defaultdict

from .layouts import LAYOUTS
from .national_id import EXCEL_NATIONAL_ID_COLUMNS, canonical_national_id

LISTED = 20
FIRST_DATA_ROW = 2


def id_column_for(slug, columns):
    layout = LAYOUTS.get(slug)
    if layout:
        return layout['id_column'] if layout['id_column'] in columns else None
    present = [c for c in EXCEL_NATIONAL_ID_COLUMNS if c in columns]
    if present:
        return present[0]
    return next((c for c in columns if 'کد ملی' in str(c)), None)


def looks_like(slug, columns):
    """Another layout whose id column this sheet has, if any."""
    return next((other for other, layout in LAYOUTS.items()
                 if other != slug and layout['id_column'] in columns), None)


def check_sheet(slug, rows, columns):
    """Warnings for a parsed sheet going into monitoring `slug`."""
    columns = [str(c) for c in columns]
    if not rows:
        return [{'level': 'warning', 'code': 'no_rows'}]

    layout = LAYOUTS.get(slug)
    id_column = id_column_for(slug, columns)
    warnings = []
    if layout and id_column is None:
        warning = {'level': 'warning', 'code': 'missing_id_column',
                   'column': layout['id_column'], 'found': columns[:LISTED]}
        other = looks_like(slug, columns)
        if other:
            warning['looks_like'] = other
        warnings.append(warning)
    elif id_column is None:
        warnings.append({'level': 'warning', 'code': 'no_id_column'})
    else:
        blank, invalid, seen = [], [], defaultdict(list)
        for index, row in enumerate(rows):
            number = index + FIRST_DATA_ROW
            value = canonical_national_id(row.get(id_column))
            if value in (None, ''):
                blank.append(number)
            elif not (isinstance(value, str) and len(value) == 10 and value.isdigit()):
                invalid.append({'row': number, 'value': str(value)})
            else:
                seen[value].append(number)
        duplicates = [{'value': v, 'rows': r} for v, r in seen.items() if len(r) > 1]
        if blank:
            warnings.append({'level': 'warning', 'code': 'blank_ids',
                             'count': len(blank), 'rows': blank[:LISTED]})
        if invalid:
            warnings.append({'level': 'warning', 'code': 'invalid_ids',
                             'count': len(invalid), 'rows': invalid[:LISTED]})
        if duplicates:
            warnings.append({'level': 'warning', 'code': 'duplicate_ids',
                             'count': len(duplicates), 'groups': duplicates[:LISTED]})

    if layout:
        missing = [c for c in layout['chart_columns'] if c not in columns]
        if missing:
            warnings.append({'level': 'warning', 'code': 'missing_columns', 'columns': missing})
    return warnings
```

- [ ] **Step 5: Use it in the upload serializer.** Replace the body of `create` from `try:` through `objects.create(...)` with:

```python
        try:
            # Every cell as text: a component parses a number only where it
            # needs one. Empty cells stay NaN here and become None below.
            df = pd.read_excel(file, dtype=str)
        except Exception as e:
            raise serializers.ValidationError({
                'file': ['The file could not be read.'],
                'issues': [{'level': 'error', 'code': 'unreadable', 'detail': str(e)}],
            })

        df = df.astype(object).where(pd.notnull(df), None)
        json_data = df.to_dict(orient="records")
        for row in json_data:
            for column in EXCEL_NATIONAL_ID_COLUMNS:
                if column in row:
                    row[column] = canonical_national_id(row[column])

        warnings = check_sheet(type.slug, json_data, list(df.columns))

        instance = SaderatBankHealthMonitoring.objects.create(
            name=name, type=type, json=json_data)
        instance.upload_issues = warnings
        return instance
```

Import `from .upload_checks import check_sheet`. The existing `UniqueTogetherValidator` (the same name twice in one monitoring) stays: that is a name-field message, not a file problem.

Check with pandas: a numeric cell read with `dtype=str` comes back as `'70'`, not `'70.0'`, because openpyxl yields an `int` for a whole number. If the test shows `'70.0'`, strip a trailing `.0` from whole floats in a small loop before `to_dict`. Don't change the test.

In `views.py`, `upload_excel`:

```python
        instance = serializer.save()
        return Response({'message': 'Excel uploaded successfully', 'id': instance.id,
                         'issues': getattr(instance, 'upload_issues', [])})
```

The `inline_serializer` fields become `{'message': CharField(), 'id': IntegerField(), 'issues': ListField(child=DictField())}`.

- [ ] **Step 6: Run the suite.** `manage.py test --noinput`. Expected: `OK`. `UploadKeepsNationalIdZerosTests` still passes: the numeric cell `12345678` is read as the text `'12345678'` and padded to `'0012345678'`.

- [ ] **Step 7: Commit** `feat: upload stores every cell as text, saves any readable file, lists what to check`

### Task 3b: Numbers are parsed where they are used (Next.js)

New uploads hold text only; older uploads hold numbers. Every place that needs a number must accept both. The 2026-09-28 search found four such places, all in Step 1. Step 2 already reads every cell as text.

**Files:**
- Modify: `N/src/lib/campaign.ts` (add `toNumber`; created in Task 6, so create the file here if Task 6 has not run, with only this function and its test)
- Modify: `C/saderat-bank-health-monitoring/step-1/[id]/page.tsx` (lines ~81, ~101, ~306)
- Modify: `C/saderat-bank-health-monitoring/step-1/[id]/[national_id]/page.tsx` (line ~470)
- Test: `N/tests/campaign.test.mjs`

**Interfaces:**
- Produces: `toNumber(value: unknown): number | undefined`. It folds Persian/Arabic digits and the Persian decimal separator `٫`, trims, and accepts only a plain decimal number; everything else is `undefined`.

- [ ] **Step 1: Failing test** (in `tests/campaign.test.mjs`):

```js
import { toNumber } from '../src/lib/campaign.ts';

test('toNumber reads text and numbers alike, and refuses anything else', () => {
  assert.equal(toNumber(24.5), 24.5);
  assert.equal(toNumber('24.5'), 24.5);
  assert.equal(toNumber(' ۲۴٫۵ '), 24.5);
  assert.equal(toNumber('70'), 70);
  assert.equal(toNumber('-3'), -3);
  assert.equal(toNumber(''), undefined);
  assert.equal(toNumber(null), undefined);
  assert.equal(toNumber('12 kg'), undefined);
  assert.equal(toNumber(Number.NaN), undefined);
});
```

- [ ] **Step 2: Run to verify it fails.** `node --test --experimental-strip-types tests/campaign.test.mjs`. Expected: FAIL (`toNumber` is not exported).

- [ ] **Step 3: Implement** in `campaign.ts`:

```ts
/** A spreadsheet cell as a number, whether stored as text or as a number. */
export const toNumber = (value: unknown): number | undefined => {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value !== "string") return undefined;
  const text = value
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace("٫", ".")
    .trim();
  return /^-?\d+(\.\d+)?$/.test(text) ? Number(text) : undefined;
};
```

- [ ] **Step 4: Use it at the four places.**
  - Step 1 report, `numericStats` (~line 81): map through `toNumber` and keep the defined values, instead of filtering `typeof v === "number"`:
    `.map((v) => toNumber(v)).filter((v): v is number => v !== undefined)`.
  - `categorizeNumeric` (~line 101): `const value = toNumber(item[field]); if (value !== undefined) { … }`.
  - `handleRangeBarClick` (~line 306): `const value = toNumber(record[field]); if (value === undefined) return false;`.
  - Step 1 person page (~line 470): `toNumber(person_data["BMI"])?.toLocaleString("en-US", { … }) ?? formatCellValue(String(person_data["BMI"] ?? "-"), locale)`, keeping the existing options object.

  Import `toNumber` from `@/lib/campaign`. The Step 1 files move in Tasks 10 and 13, and those moves carry these edits along unchanged.

- [ ] **Step 5: Verify.**
  - The tests pass; `npx tsc --noEmit` passes; lint is unchanged on both files (25 existing errors on the report stay 25).
  - Browser: an existing Step 1 upload still shows the age and BMI averages and distributions.
  - Seed a Step 1 upload whose cells are all text (`SaderatBankHealthMonitoring.objects.create(..., json=[{'personel.کد ملی': '0012345678', 'سن': '41', 'BMI': '24.5', 'BMI_Group': 'normal', ...}])`): the averages and distributions show the same values.

- [ ] **Step 6: Commit** (Next.js) `fix: parse spreadsheet numbers where charts use them`

### Task 4: Person reports carry the campaign, and rows on request

**Files:**
- Modify: `D/saderatBankHealthMonitoring/serializers.py` (`PersonReportSerializer`)
- Modify: `D/saderatBankHealthMonitoring/views.py` (`PersonReportsView.list`, plus a `monitoring` `OpenApiParameter`)
- Test: `D/saderatBankHealthMonitoring/test_person_reports.py`

**Interfaces:**
- Produces: each person-report item carries `monitoring: {id, slug, name_en, name_fa}`. With `?monitoring=<id>`, only that campaign's uploads are returned, and each carries `rows: list[dict]` (only this person's rows). Without it, `rows` is absent.

- [ ] **Step 1: Write the failing tests** (append to `PersonReportsApiTests`):

```python
    def test_items_name_their_campaign(self):
        self.client.force_authenticate(self.staff)
        item = next(r for r in self.get().data if r['id'] == self.first.id)
        self.assertEqual(item['monitoring']['slug'], 'step_1')
        self.assertEqual(set(item['monitoring']), {'id', 'slug', 'name_en', 'name_fa'})
        self.assertNotIn('rows', item)

    def test_one_campaign_with_the_persons_rows_only(self):
        self.client.force_authenticate(self.staff)
        step_2 = MonitoringType.objects.get(slug='step_2')
        response = self.client.get(reverse(URL), {'national_id': '0012345678', 'monitoring': step_2.id})
        self.assertEqual(response.status_code, 200)
        by_id = {r['id']: r for r in response.data}
        self.assertEqual(set(by_id), {self.duplicated.id, self.legacy.id})
        self.assertEqual(len(by_id[self.duplicated.id]['rows']), 2)
        self.assertEqual(by_id[self.legacy.id]['rows'], [{'کد ملی': 12345678}])

    def test_rejects_a_non_numeric_monitoring(self):
        self.client.force_authenticate(self.staff)
        response = self.client.get(reverse(URL), {'national_id': '0012345678', 'monitoring': 'x'})
        self.assertEqual(response.status_code, 400)
```

- [ ] **Step 2: Run to verify they fail.** Expected: `KeyError: 'monitoring'`.

- [ ] **Step 3: Implement.** In `serializers.py`:

```python
class CampaignRefSerializer(serializers.ModelSerializer):
    class Meta:
        model = MonitoringType
        fields = ['id', 'slug', 'name_en', 'name_fa']


class PersonReportSerializer(serializers.ModelSerializer):
    """One Excel upload that mentions a person; `rows` only when asked for."""

    type = serializers.SlugRelatedField(slug_field='slug', read_only=True)
    monitoring = CampaignRefSerializer(source='type', read_only=True)
    match_count = serializers.IntegerField(read_only=True)
    rows = serializers.ListField(child=serializers.DictField(), read_only=True, required=False)

    class Meta:
        model = SaderatBankHealthMonitoring
        fields = ['id', 'name', 'type', 'monitoring', 'created_at', 'match_count', 'rows']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if not hasattr(instance, 'rows'):
            data.pop('rows', None)
        return data
```

In `PersonReportsView.list`:
- Read `monitoring = request.query_params.get('monitoring')`. If it is present and not `isdigit()`, return `400 {'monitoring': ['A numeric monitoring id is required.']}`.
- If it is present, add `.filter(type_id=int(monitoring))` to the queryset.
- Replace the `match_count` loop with a loop that collects matching rows:

```python
            matched = [row for row in upload.json or []
                       if isinstance(row, dict) and any(
                           canonical_national_id(row.get(column)) == national_id
                           for column in EXCEL_NATIONAL_ID_COLUMNS)]
            upload.match_count = len(matched)
            if monitoring:
                upload.rows = matched
            if matched:
                uploads.append(upload)
```

Add `OpenApiParameter('monitoring', int, required=False, description='Limit to one monitoring and include the rows.')` to the view's `extend_schema`.

- [ ] **Step 4: Run the suite.** Expected: `OK`.

- [ ] **Step 5: Regenerate the contract and commit (Django)**

```bash
cd D && ../dashboard-django/venv/bin/python manage.py spectacular --file openapi.yaml --validate
git add saderatBankHealthMonitoring openapi.yaml && git commit -m "feat: person reports name their campaign and return rows for one campaign

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Task 5: Next.js API types

**Files:**
- Modify: `N/src/data/api-schema.d.ts` (generated)
- Modify: `N/src/data/saderat-bank-health-monitoring/api/person-reports.ts`
- Modify: `N/src/data/saderat-bank-health-monitoring/api/upload-excel.ts`

**Interfaces:**
- Produces:
  - `listPersonReports(nationalId: string, monitoring?: number)`.
  - `useList_PersonReports_API({ nationalId, monitoring?, enabled? })`, whose query key includes `monitoring`.
  - `UploadIssue`, `UploadExcelResult` from `@/data/saderat-bank-health-monitoring/api/upload-excel`; `useUploadExcelApi` returns `UploadExcelResult`.

- [ ] **Step 1: Regenerate the types**

```bash
cd N && npx -y openapi-typescript@7.13.0 ../dashboard-django-app-journeys/openapi.yaml -o src/data/api-schema.d.ts
grep -n "upload_count\|record_count\|CampaignRef" src/data/api-schema.d.ts
```

Expected: `upload_count`, `record_count` and `CampaignRef` all appear.

- [ ] **Step 2: Extend the hooks.** In `person-reports.ts`:

```ts
export const listPersonReports = async (nationalId: string, monitoring?: number) => {
  const response = await apiInstance.get<SBHM_PersonReport[]>(PATH, {
    params: monitoring === undefined
      ? { national_id: nationalId }
      : { national_id: nationalId, monitoring },
    withAuthorization: true,
  });
  return response.data;
};

export const PERSON_REPORTS_QUERY_KEY = (nationalId: string, monitoring?: number) => [
  "saderat-bank-health-monitoring", "person-reports", nationalId, monitoring ?? "all",
];

export const useList_PersonReports_API = ({
  nationalId, monitoring, enabled = true,
}: { nationalId: string; monitoring?: number; enabled?: boolean }) =>
  useQuery({
    queryKey: PERSON_REPORTS_QUERY_KEY(nationalId, monitoring),
    queryFn: () => listPersonReports(nationalId, monitoring),
    enabled: enabled && /^\d{10}$/.test(nationalId),
  });
```

In `upload-excel.ts`, add and export the issue types, and type the mutation with them (both the data type in `UseMutationOptions<…>` and `upload_excel`'s return):

```ts
/** One upload problem, as Django reports it: a code plus details, never a sentence. */
export type UploadIssue =
  | { level: "error"; code: "unreadable"; detail: string }
  | { level: "error"; code: "no_rows" }
  | { level: "error"; code: "missing_id_column"; column: string; found: string[]; looks_like?: string }
  | { level: "warning"; code: "no_id_column" }
  | { level: "warning"; code: "blank_ids"; count: number; rows: number[] }
  | { level: "warning"; code: "invalid_ids"; count: number; rows: { row: number; value: string }[] }
  | { level: "warning"; code: "duplicate_ids"; count: number; groups: { value: string; rows: number[] }[] }
  | { level: "warning"; code: "missing_columns"; columns: string[] };

export type UploadExcelResult = { message: string; id: number; issues: UploadIssue[] };
```

A refused upload's `AxiosError.response.data` is `{ file: string[]; issues: UploadIssue[] }`.

- [ ] **Step 3: Verify.** `npx tsc --noEmit` exits 0.

- [ ] **Step 4: Commit** `chore: sync API types with campaign counts, person rows and upload id`

---

## Slice 2: Sidebar, campaign list, upload page

### Task 6: Pure helpers with tests

**Files:**
- Modify: `N/src/lib/national-id.ts` (drop the `@/` import so node can test it)
- Modify: `N/tsconfig.json` (`allowImportingTsExtensions`)
- Create: `N/src/lib/campaign.ts`
- Test: `N/tests/national-id.test.mjs`, `N/tests/campaign.test.mjs`

**Interfaces:**
- Produces, in `@/lib/campaign`:
  - `NATIONAL_ID_COLUMNS: readonly string[]`
  - `findNationalIdColumn(rows: Record<string, unknown>[]): string | undefined`
  - `campaignUploads<U extends { type: string; created_at: string; id: number }>(uploads: U[], slug: string): U[]` (newest first)
  - `pickUpload<U extends { id: number }>(uploads: U[], requested: string | null): { selected: U | undefined; requestedMissing: boolean }`
  - `rowMatches(row: Record<string, unknown>, query: string): boolean`
- Produces, in `@/lib/national-id` (same exports as today): `fullNationalId`, `isNationalId`, `PATIENT_PATH`, `patientHref`, plus `CAMPAIGN_PATIENT_PATH(campaignId: number, nationalId: string)`.

- [x] **Step 1: Write the failing tests.** `tests/national-id.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fullNationalId, isNationalId, CAMPAIGN_PATIENT_PATH } from '../src/lib/national-id.ts';

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

test('campaign patient path uses the folded id', () => {
  assert.equal(CAMPAIGN_PATIENT_PATH(3, '۱۲۳۴۵۶۷۸'), '/console/monitorings/3/patients/0012345678');
});
```

`tests/campaign.test.mjs`:

```js
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
```

- [x] **Step 2: Run to verify they fail.** `node --test --experimental-strip-types tests/national-id.test.mjs tests/campaign.test.mjs`. Expected: FAIL. `national-id.ts` cannot resolve `@/components/schema-form/types`, and `campaign.ts` does not exist.

- [x] **Step 3: Implement.** In `src/lib/national-id.ts`, replace `import { toDigits } from "@/components/schema-form/types";` with a local function, and add the campaign path:

```ts
/** Persian and Arabic-Indic digits to ASCII, everything else dropped. */
export const asciiDigits = (raw: string) =>
  raw
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[^0-9]/g, "");
```

Replace `fullNationalId` so it folds digits but never deletes letters. Stripping `12345678A` to `0012345678` would open another real person (verified 2026-09-28).

```ts
/** Persian and Arabic-Indic digits to ASCII; everything else kept. */
const foldDigits = (raw: string) =>
  raw
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));

export const fullNationalId = (raw: string | number | null | undefined) => {
  const compact = foldDigits(String(raw ?? "")).replace(/[\s-]/g, "");
  if (!/^\d+$/.test(compact)) return compact;
  return compact.length >= 8 && compact.length < 10 ? compact.padStart(10, "0") : compact;
};
```

Then add:

```ts
/** A patient inside one campaign (a MonitoringType id). */
export const CAMPAIGN_PATIENT_PATH = (campaignId: number, nationalId: string) =>
  `/console/monitorings/${campaignId}/patients/${fullNationalId(nationalId)}`;
```

Create `src/lib/campaign.ts`:

```ts
import { asciiDigits } from "./national-id.ts";

/** Where a spreadsheet keeps the national id: step_1, its summary sheet, step_2. */
export const NATIONAL_ID_COLUMNS = ["personel.کد ملی", "تجمیع نتایج.کد ملی", "کد ملی"] as const;

/** The column holding the national id in these rows, if any. */
export const findNationalIdColumn = (rows: Record<string, unknown>[]) => {
  const keys = new Set(rows.flatMap((row) => Object.keys(row)));
  return (
    NATIONAL_ID_COLUMNS.find((column) => keys.has(column)) ??
    [...keys].find((key) => key.includes("کد ملی"))
  );
};

/** One campaign's uploads, newest first. `type` is the campaign's slug. */
export const campaignUploads = <U extends { type: string; created_at: string; id: number }>(
  uploads: U[],
  slug: string
) =>
  uploads
    .filter((upload) => upload.type === slug)
    .sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id - a.id);

/** The upload to show: the requested one if it is in the list, else the newest. */
export const pickUpload = <U extends { id: number }>(uploads: U[], requested: string | null) => {
  const found = requested === null ? undefined : uploads.find((u) => String(u.id) === requested);
  return {
    selected: found ?? uploads[0],
    requestedMissing: requested !== null && found === undefined,
  };
};

/** Whether any cell of `row` contains `query`, ignoring case and digit script. */
export const rowMatches = (row: Record<string, unknown>, query: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const qDigits = asciiDigits(q);
  return Object.values(row).some((value) => {
    const text = String(value ?? "").toLowerCase();
    return text.includes(q) || (qDigits.length > 0 && asciiDigits(text).includes(qDigits));
  });
};
```

Node's type stripping needs the `.ts` extension on relative imports, and tsc refuses those by default. Add `"allowImportingTsExtensions": true` to `compilerOptions` in `N/tsconfig.json` (valid because it already has `"noEmit": true`). `national-id.ts` imports `format` from `date-fns`; node resolves it from `node_modules`.

- [x] **Step 4: Run the tests and tsc.** Both test files pass; `npx tsc --noEmit` exits 0; `node --test --experimental-strip-types tests/patient-session.test.mjs` still passes.

- [x] **Step 5: Commit** `feat: campaign and national id helpers with tests`

### Task 7: Sidebar and console home in two sections

**Files:**
- Modify: `C/_nav/items.ts`
- Modify: `N/messages/en.json`, `N/messages/fa.json` (`/console.ConsoleSidebar`, `/console.ConsoleHome.descriptions`)

**Interfaces:**
- Produces: `ConsoleNavGroup = "home" | "health" | "monitorings"`; `CONSOLE_NAV_GROUPS = ["home", "health", "monitorings"]`.

- [ ] **Step 1: Replace the groups and items** in `items.ts`. Keep `ConsoleNavItem`, `ownsPath` and `isConsoleNavItemActive`, but delete the special case for `/console/monitorings` inside `isConsoleNavItemActive`: the campaign list now owns every `/console/monitorings/...` path except the ones owned below.

```ts
export type ConsoleNavGroup = "home" | "health" | "monitorings";

export const CONSOLE_NAV_ITEMS: ConsoleNavItem[] = [
  { titleKey: "home", descriptionKey: "home", url: "/console", icon: House, group: "home" },
  {
    titleKey: "findPatient", descriptionKey: "findPatient",
    url: "/console/electronic-health-record", icon: Search, group: "health", primary: true,
    activePrefixes: ["/console/patients", "/console/patient-reports"],
  },
  { titleKey: "periodicalReports", descriptionKey: "periodicalReports", url: "/console/periodical-reports", icon: BarChart, group: "health" },
  {
    titleKey: "campaigns", descriptionKey: "campaigns",
    url: "/console/monitorings", icon: Tags, group: "monitorings",
  },
  { titleKey: "formSabtPayesh", descriptionKey: "formSabtPayesh", url: "/console/form-sabt-payesh", icon: FileText, group: "monitorings" },
  {
    titleKey: "recordMonitoring", descriptionKey: "recordMonitoring",
    url: "/console/record-monitoring", icon: ClipboardList, group: "monitorings",
    activePrefixes: ["/console/monitorings/*/records"], staffOnly: true,
  },
  { titleKey: "uploadExcel", descriptionKey: "uploadExcel", url: "/console/monitorings/upload", icon: Upload, group: "monitorings", staffOnly: true },
  { titleKey: "defineCampaign", descriptionKey: "defineCampaign", url: "/console/monitorings/new", icon: Plus, group: "monitorings", staffOnly: true },
];

export const CONSOLE_NAV_GROUPS: ConsoleNavGroup[] = ["home", "health", "monitorings"];
```

`isConsoleNavItemActive` must now give the most specific item: `/console/monitorings/upload` activates "uploadExcel" only, not "campaigns". Replace the function with:

```ts
export const isConsoleNavItemActive = (item: ConsoleNavItem, pathname: string) => {
  if (item.url === "/console") return pathname === item.url;
  if (item.activePrefixes?.some((prefix) => ownsPath(prefix, pathname))) return true;
  const owns = pathname === item.url || pathname.startsWith(`${item.url}/`);
  if (!owns) return false;
  // A longer item URL or prefix that also owns the path wins.
  return !CONSOLE_NAV_ITEMS.some((other) =>
    other !== item &&
    ((other.url.length > item.url.length &&
      (pathname === other.url || pathname.startsWith(`${other.url}/`))) ||
      other.activePrefixes?.some((prefix) => ownsPath(prefix, pathname)))
  );
};
```

Import `Upload`, `Plus` from `lucide-react`; drop `SquareActivity` if it becomes unused.

- [ ] **Step 2: Messages.** In both files, set `/console.ConsoleSidebar.groups` to exactly:
  - en: `{"health": "Health record", "monitorings": "Monitorings"}`
  - fa: `{"health": "پرونده سلامت", "monitorings": "پایش‌ها"}`

Set or add these `ConsoleSidebar` keys, and delete `saderatBankHealthMonitoring`, `monitorings` and `electronicHealthRecord` if nothing else uses them (grep first):

| key | en | fa |
|---|---|---|
| findPatient | Find a patient | جستجوی بیمار |
| periodicalReports | Periodic reports | گزارش دوره‌ای |
| campaigns | All monitorings | فهرست پایش‌ها |
| formSabtPayesh | Online form (FormAfzar) | فرم آنلاین (فرم‌افزار) |
| recordMonitoring | Enter patient data | ثبت اطلاعات بیمار |
| uploadExcel | Upload monitoring Excel | بارگذاری اکسل پایش |
| defineCampaign | Define a new monitoring | تعریف پایش جدید |

And these `ConsoleHome.descriptions` (same keys, removing the unused ones):

| key | en | fa |
|---|---|---|
| findPatient | Open one patient's health record | پرونده سلامت یک بیمار را باز کنید |
| periodicalReports | Charts of services and patients over a period | نمودار خدمات و بیماران در یک بازه |
| campaigns | Every monitoring, its Excel uploads and records | همه پایش‌ها با اکسل‌ها و اطلاعات ثبت‌شده |
| formSabtPayesh | The external FormAfzar monitoring form | فرم پایش خارجی فرم‌افزار |
| recordMonitoring | Choose a monitoring and enter a patient's data | پایش را انتخاب کنید و اطلاعات بیمار را ثبت کنید |
| uploadExcel | Add a monitoring's Excel file | فایل اکسل یک پایش را اضافه کنید |
| defineCampaign | Create a monitoring and its form fields | پایش و فیلدهای فرم آن را بسازید |

- [ ] **Step 3: Verify.** `npx tsc --noEmit` exits 0; `node scripts/check-messages.mjs` passes; lint on `items.ts` is unchanged.

- [ ] **Step 4: Commit** `feat: sidebar in two sections, health record and monitorings`

### Task 8: Campaign list page, and the builder renamed

**Files:**
- Rewrite: `C/monitorings/page.tsx` (keep `DeleteMonitoringTypeDialog` usage)
- Modify: `C/monitorings/_builder/type-form.tsx` (after a create, go to `/console/monitorings/<new id>`)
- Modify: messages namespace `/console/monitorings.MonitoringTypesPage` and `/console/monitorings.Builder` (titles only)

**Interfaces:**
- Consumes: `useList_MonitoringType_API()` returning `MonitoringType & { upload_count: number; record_count: number }`.
- Produces: `/console/monitorings` lists campaigns, each linking to `/console/monitorings/[id]`.

- [ ] **Step 1: Rewrite the page.** Replace the `DataTable` with a list in the style of `C/record-monitoring/page.tsx`.
  - Each item links to `/console/monitorings/${id}`. It shows the localized name (`locale === "fa" ? name_fa : name_en`) and a muted line `t("counts", { uploads: localeDigits(upload_count, locale), records: localeDigits(record_count, locale) })`.
  - Staff also get two `RowAction`s on each item: edit (→ `/[id]/edit`) and delete (opens `DeleteMonitoringTypeDialog`).
  - `PageHeader`: breadcrumbs `<ConsoleBreadcrumbs />`, title `t("PageTitle")`, description `t("PageDescription")`, and staff actions: `<Link href="/console/monitorings/new">t("CreateType")</Link>` and `<Link href="/console/monitorings/upload">tNav("uploadExcel")</Link>`.
  - Keep the existing loading, error and empty branches.

- [ ] **Step 2: Messages** (`/console/monitorings.MonitoringTypesPage`, both files; replace existing values):

| key | en | fa |
|---|---|---|
| PageTitle | Monitorings | پایش‌ها |
| PageDescription | Every monitoring with its Excel uploads and entered records. | هر پایش با فایل‌های اکسل و اطلاعات ثبت‌شده‌اش. |
| CreateType | Define a new monitoring | تعریف پایش جدید |
| counts (new) | {uploads} Excel uploads · {records} records | {uploads} اکسل · {records} اطلاعات ثبت‌شده |

In `/console/monitorings.Builder`: `NewTitle` → "Define a new monitoring" / "تعریف پایش جدید"; `EditTitle` → "Edit monitoring" / "ویرایش پایش".

- [ ] **Step 3: Builder navigation.** In `type-form.tsx`, find the `router.push(LIST_PATH)` in the save handler. On **create**, navigate to `/console/monitorings/${created.id}` using the mutation's returned object; on **edit**, navigate to `/console/monitorings/${id}`. Point the breadcrumb parent at `{ href: LIST_PATH, label: tNav("campaigns") }`.

- [ ] **Step 4: Verify.** `npx tsc --noEmit`, the message check, and the lint comparison. Then a browser check as staff and as viewer at `/fa/console/monitorings`:
  - rows show counts;
  - the viewer sees no edit, delete or create controls.

- [ ] **Step 5: Commit** `feat: monitorings list shows campaigns with their counts`

### Task 9: Upload page

**Files:**
- Create: `C/monitorings/upload/page.tsx`, `C/monitorings/upload/layout.tsx` (metadata key `uploadExcel`)
- Move: the form in `C/saderat-bank-health-monitoring/_upload-excel-dialog/dialog.tsx` → `C/monitorings/upload/_form.tsx` (a plain form, no `Dialog`)
- Delete: `C/saderat-bank-health-monitoring/_upload-excel-dialog/`
- Modify: `C/saderat-bank-health-monitoring/page.tsx` (drop the dialog import and the header action)
- Messages: `metadata.uploadExcel` `{title, description}` in both files; reuse the `UploadSaderatBankHealthMonitoringExcelDialog` keys, renaming `DialogTitle` → `PageTitle`.

**Interfaces:**
- Consumes: `useUploadExcelApi` returning `{ id }`; `useList_MonitoringType_API`.
- Produces: `/console/monitorings/upload?campaign=<id>`. On success it navigates to `/console/monitorings/<campaignId>?upload=<newId>`.

- [ ] **Step 1: Build the page.**
  - `page.tsx` is `"use client"`. It renders `<StaffOnly>` around a `PageHeader` (breadcrumbs parent `{ href: "/console/monitorings", label: tNav("campaigns") }`, title `t("PageTitle")`) and `<UploadExcelForm />`.
  - `_form.tsx` is the dialog body without `Dialog`/`DialogContent`/`DialogTrigger`/`open` state, with these changes:
    - The campaign `Select` lists **all** types (remove the `isKnownSBHM_Type` filter). Its value is the slug, as the API expects.
    - The default campaign is `searchParams.get("campaign")`, mapped to that type's slug once types load (render the form only once `types.data` exists, and pass the matching slug as `defaultValues.type` to `useForm`).
    - On success, `router.push(\`/console/monitorings/${campaign.id}?upload=${result.id}\`)`, where `campaign` is the type whose slug was submitted. Keep the toast and the `LIST_SBHM_QUERY_KEY` invalidation.
    - **Refused** (400 with `issues`: only an unreadable file): don't set a field error. Show an `Alert variant="destructive"` titled `t("refusedTitle")` containing `<UploadIssues issues={issues} campaigns={types.data} />`.
    - **Saved with warnings** (200, `issues.length > 0`): don't navigate. Replace the form with a result panel: title `t("savedWithIssues", { count })`, `<UploadIssues …/>`, and two buttons, `t("openUpload")` (→ the campaign page with `?upload=`) and `t("uploadAnother")` (resets the form).
    - **Saved clean**: navigate as above.
  - `C/monitorings/upload/_issues.tsx` exports `UploadIssues({ issues, campaigns })`. It renders a `<ul>` with one `<li>` per issue, using `t(\`issues.${issue.code}\`, values)`. The values are built per code:
    - row lists are joined with `، ` in fa and `, ` in en, digits through `localeDigits`;
    - more than listed → append `t("issues.more", { count: total - listed })`;
    - `invalid_ids` renders `row (value)`;
    - `duplicate_ids` renders `value (rows …)`;
    - `found` and `columns` are joined the same way inside `<bdi>` so Latin column names keep their order in RTL;
    - `looks_like` is shown as a second line `t("issues.looks_like", { campaign })`, where `campaign` is the localized name of the type with that slug;
    - `unreadable` shows `detail` in a muted `<code dir="ltr">` line.
  - Messages (`/console/saderat-bank-health-monitoring.UploadSaderatBankHealthMonitoringExcelDialog`, both files):

| key | en | fa |
|---|---|---|
| refusedTitle | The file was not uploaded | فایل بارگذاری نشد |
| savedWithIssues | Uploaded. {count} things to check: | بارگذاری شد. {count} مورد برای بررسی: |
| openUpload | Open this upload | مشاهده این فایل |
| uploadAnother | Upload another file | بارگذاری فایل دیگر |
| issues.unreadable | The file could not be read. Save it as an .xlsx file and try again. | فایل خوانده نشد. آن را با قالب ‎.xlsx ذخیره کنید و دوباره تلاش کنید. |
| issues.no_rows | The sheet has no data rows under its header row, so there is nothing to show. | برگه زیر ردیف سرستون‌ها هیچ ردیف داده‌ای ندارد و چیزی برای نمایش نیست. |
| issues.missing_id_column | The column “{column}” is missing: the charts work, but no one in this file can be opened. Columns found: {found} | ستون «{column}» وجود ندارد: نمودارها کار می‌کنند، اما هیچ‌کس در این فایل باز نمی‌شود. ستون‌های موجود: {found} |
| issues.looks_like | This looks like a “{campaign}” file. Did you choose the right monitoring? | این فایل شبیه فایل «{campaign}» است. آیا پایش درست را انتخاب کرده‌اید؟ |
| issues.no_id_column | No national ID column was found, so these rows can’t be linked to patients. | ستون کد ملی پیدا نشد، بنابراین این ردیف‌ها به بیماران وصل نمی‌شوند. |
| issues.blank_ids | {count} rows have no national ID and can’t be opened. Rows: {rows} | {count} ردیف کد ملی ندارند و باز نمی‌شوند. ردیف‌ها: {rows} |
| issues.invalid_ids | {count} rows have a national ID that isn’t 10 digits and won’t match a patient: {rows} | {count} ردیف کد ملی ۱۰ رقمی ندارند و به بیماری وصل نمی‌شوند: {rows} |
| issues.duplicate_ids | {count} national IDs appear on more than one row; every row is kept: {groups} | {count} کد ملی در بیش از یک ردیف آمده‌اند؛ همه ردیف‌ها نگه داشته می‌شوند: {groups} |
| issues.missing_columns | These columns are missing, so the charts that use them will be empty: {columns} | این ستون‌ها وجود ندارند و نمودارهای مربوط خالی می‌مانند: {columns} |
| issues.more | and {count} more | و {count} مورد دیگر |
  - `layout.tsx` carries metadata the way `C/patients/[national_id]/layout.tsx` does.

- [ ] **Step 2: Verify.**
  - `npx tsc --noEmit` and the message check.
  - Browser as staff:
    - upload a small xlsx to "Blood pressure check" → lands on `/fa/console/monitorings/3?upload=<id>`;
    - upload a Step 2 sheet to Step 1 → saved; the result panel names the missing `personel.کد ملی` column, lists the columns found, and asks "Did you choose the right monitoring?" naming Step 2;
    - upload a Step 2 sheet with one blank and one duplicate ID → saved; the result panel lists both with Excel row numbers and the missing chart columns; "Open this upload" goes to the campaign page;
    - upload a `.txt` renamed to `.xlsx` → refused with the "could not be read" message and the parser detail;
    - check the same three in `/en/`.
  - As viewer, the page shows "Staff access required".

- [ ] **Step 3: Commit** `feat: upload Excel on its own page, to any monitoring`

---

## Slice 3: Campaign page

### Task 10: Reports become embeddable; a generic rows table

**Files:**
- Modify: `C/saderat-bank-health-monitoring/step-1/[id]/route-context.tsx` (`MonitoringIdRouteProvider` takes an optional `uploadId` prop)
- Move: `C/saderat-bank-health-monitoring/step-1/[id]/page.tsx` → `C/monitorings/_reports/step-1-report.tsx` (`git mv`), exported `Step1Report`
- Move: `C/saderat-bank-health-monitoring/step-2/[id]/page.tsx` → `C/monitorings/_reports/step-2-report.tsx`, exported `Step2Report`
- Recreate: both old `page.tsx` files as thin wrappers (replaced by redirects in Task 12)
- Modify: both `_search-personnel-sheet/sheet.tsx` (add a `personHref` prop)
- Create: `C/monitorings/_reports/rows-table.tsx`

**Interfaces:**
- Produces:
  - `Step1Report({ uploadId: number; personHref: (nationalId: string) => string })`
  - `Step2Report({ uploadId: number; personHref: (nationalId: string) => string })`
  - `UploadRowsTable({ uploadId: number; personHref: (nationalId: string) => string })`
  - `SearchPersonnelSheet` gains a required `personHref: (nationalId: string) => string` in both step folders, replacing the hard-coded person URLs (step-1 sheet lines 102 and 179; step-2 sheet lines 105 and 189).

- [ ] **Step 1: Route context.** Change `MonitoringIdRouteProvider` to:

```tsx
export const MonitoringIdRouteProvider: React.FC<React.PropsWithChildren<{ uploadId?: number }>> = ({
  children,
  uploadId,
}) => {
  const params = useParams<{ id: string }>();
  const id = uploadId ?? parseInt(params.id);
  const monitoring_query = useRetrieve_SBHM_API({ input: { pathVariables: { id } } });
  return (
    <MonitoringIdRouteContext.Provider value={{ monitoring_query }}>
      {children}
    </MonitoringIdRouteContext.Provider>
  );
};
```

- [ ] **Step 2: Move and adapt Step 1.** `git mv` the page file to `C/monitorings/_reports/step-1-report.tsx`, then:
  - Fix relative imports: `./route-context` → `@/app/[locale]/(authenticated)/console/saderat-bank-health-monitoring/step-1/[id]/route-context`; `../../_report/report-frame` is dropped (see below); `./_search-personnel-sheet/sheet` → the same absolute folder path.
  - Rename `const MonitoringPage = (props) => {…}` to `const Step1ReportBody = ({ personHref }: { personHref: (nid: string) => string }) => {…}`, and delete `const { id: monitoring_id } = React.use(props.params);`. Wherever `monitoring_id` was used (the sheet's `monitoringId`), use `monitoring_query.data?.id ?? 0`.
  - Replace each `<ReportFrame title=…>…</ReportFrame>` state wrapper with `<div className="space-y-6">…</div>`. Replace the main `<ReportFrame title=… actions=…>` with `<div className="space-y-6"><div className="flex justify-end">{actions}</div>…</div>`, keeping the search button. The campaign page owns the h1 now.
  - Pass `personHref={personHref}` to `<SearchPersonnelSheet>`.
  - Add at the end:

```tsx
export const Step1Report = ({ uploadId, personHref }: { uploadId: number; personHref: (nid: string) => string }) => (
  <MonitoringIdRouteProvider uploadId={uploadId}>
    <Step1ReportBody personHref={personHref} />
  </MonitoringIdRouteProvider>
);
```

Remove `export default`.

- [ ] **Step 3: Move and adapt Step 2** the same way into `step-2-report.tsx`:
  - `Step2MonitoringPage(props)` → `Step2Report({ uploadId, personHref })`, using `uploadId` where it used `parseInt(id)`.
  - Drop the `ReportFrame` wrappers the same way; the record count moves into the actions row as muted text.
  - Pass `personHref` to its sheet.

- [ ] **Step 4: Sheets.** In both `sheet.tsx` files add `personHref: (nationalId: string) => string;` to the props type, and replace each template-literal person URL with `personHref(nationalId)`.
  - **Never link a row whose ID is not valid.** Where the Step 1 desktop table builds the link from `row.original["personel.کد ملی"]` unchecked (a blank cell became `/null`, verified 2026-09-28), compute `const nationalId = fullNationalId(row.original["personel.کد ملی"] as string | number | null)`. Render the link only when `isNationalId(nationalId)`, and plain text otherwise.
  - Apply the same rule to the mobile lists (`href: isNationalId(id) ? personHref(id) : null`), the Step 2 sheet and `UploadRowsTable`.
  - Also show `""` instead of the literal `null`/`undefined` for blank names in the Step 1 desktop table (`String(info.getValue() ?? "")`).

- [ ] **Step 5: Thin wrappers**, so the old routes still build until Task 12. `step-1/[id]/page.tsx`:

```tsx
"use client";
import React from "react";
import { Step1Report } from "../../../monitorings/_reports/step-1-report";

export default function Page(props: PageProps<"/[locale]/console/saderat-bank-health-monitoring/step-1/[id]">) {
  const { id } = React.use(props.params);
  return <Step1Report uploadId={Number(id)} personHref={(nid) => `/console/saderat-bank-health-monitoring/step-1/${id}/${nid}`} />;
}
```

Write the step-2 wrapper the same way with `Step2Report` and `step-2`.

- [ ] **Step 6: Generic rows table** in `rows-table.tsx`:

```tsx
"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/app/loading-state";
import { Link } from "@/i18n/navigation";
import { useRetrieve_SBHM_API } from "@/data/saderat-bank-health-monitoring/api/retrieve";
import { findNationalIdColumn, rowMatches } from "@/lib/campaign";
import { formatCellValue, localeDigits } from "@/lib/utils";

/** An upload with no chart layout: its rows, searchable, linking to each person. */
export const UploadRowsTable = ({ uploadId, personHref }: { uploadId: number; personHref: (nid: string) => string }) => {
  const t = useTranslations("/console/monitorings.Campaign");
  const locale = useLocale();
  const { data, isPending, isError } = useRetrieve_SBHM_API({ input: { pathVariables: { id: uploadId } } });
  const [query, setQuery] = React.useState("");
  const rows = React.useMemo(() => (data?.json ?? []) as unknown as Record<string, unknown>[], [data]);
  const columns = React.useMemo(() => [...new Set(rows.flatMap((r) => Object.keys(r)))], [rows]);
  const idColumn = React.useMemo(() => findNationalIdColumn(rows), [rows]);
  const shown = React.useMemo(() => rows.filter((r) => rowMatches(r, query)), [rows, query]);

  if (isPending) return <LoadingState label={t("loadingRows")} />;
  if (isError) return <p role="alert" className="text-sm text-destructive">{t("rowsError")}</p>;
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{t("noRows")}</p>;

  return (
    <div className="space-y-3">
      <div className="relative max-w-sm">
        <Search aria-hidden="true" className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("searchRows")} className="ps-9" aria-label={t("searchRows")} />
      </div>
      <p className="text-sm text-muted-foreground">{t("rowCount", { shown: localeDigits(shown.length, locale), total: localeDigits(rows.length, locale) })}</p>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>{columns.map((c) => <th key={c} className="px-3 py-2 text-start font-medium whitespace-nowrap">{c}</th>)}</tr>
          </thead>
          <tbody>
            {shown.map((row, i) => (
              <tr key={i} className="border-t">
                {columns.map((c) => {
                  const text = formatCellValue(String(row[c] ?? ""), locale);
                  return (
                    <td key={c} className="px-3 py-2 whitespace-nowrap">
                      {c === idColumn && row[c] != null && row[c] !== ""
                        ? <Link className="text-primary underline-offset-4 hover:underline" href={personHref(String(row[c]))}>{text}</Link>
                        : text}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
```

`formatCellValue(value: string, locale)` takes a string; the code above always passes `String(...)`, and the row count uses `localeDigits`.

- [ ] **Step 7: Verify.** `npx tsc --noEmit`; the lint comparison for every moved or changed file (compare the moved reports against the old page files: `git show HEAD:<old path> | npx eslint --stdin --stdin-filename <new path>`; Step 1 has 25 existing `react-hooks/static-components` errors, which must stay 25); the old routes `/fa/console/saderat-bank-health-monitoring/step-2/<id>` still render charts in the browser.

- [ ] **Step 8: Commit** `refactor: step reports and the rows table mount by upload id`

### Task 11: Campaign page

**Files:**
- Create: `N/src/components/ui/tabs.tsx`
- Create: `C/monitorings/[id]/page.tsx`, `C/monitorings/[id]/layout.tsx` (metadata key `campaign`)
- Move: the records list body from `C/monitorings/[id]/records/page.tsx` → `C/monitorings/[id]/_records-panel.tsx`, exported `RecordsPanel({ monitoringId }: { monitoringId: number })` (no `PageHeader`; its "Add record" button moves into a toolbar row)
- Replace: `C/monitorings/[id]/records/page.tsx` with a redirect to `/console/monitorings/[id]?tab=records`
- Messages: new namespace `/console/monitorings.Campaign`, plus `metadata.campaign`

**Interfaces:**
- Consumes:
  - `Step1Report`, `Step2Report`, `UploadRowsTable` (Task 10);
  - `campaignUploads`, `pickUpload` (Task 6);
  - `useList_SBHM_API`, `useList_MonitoringType_API`;
  - `CAMPAIGN_PATIENT_PATH` (Task 6);
  - `DeleteSaderatBankHealthMonitoringExcelDialog` from `C/saderat-bank-health-monitoring/_delete-excel-dialog`.
- Produces: `/console/monitorings/[id]?tab=uploads|records&upload=<uploadId>`.

- [ ] **Step 1: Tabs component** (`src/components/ui/tabs.tsx`, shadcn new-york over `radix-ui`):

```tsx
"use client"

import * as React from "react"
import { Tabs as TabsPrimitive } from "radix-ui"
import { cn } from "cn"

function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root data-slot="tabs" className={cn("flex flex-col gap-4", className)} {...props} />
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn("inline-flex h-9 w-fit max-w-full items-center overflow-x-auto rounded-lg bg-muted p-[3px] text-muted-foreground", className)}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex h-[calc(100%-1px)] items-center justify-center gap-1.5 rounded-md border border-transparent px-3 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content data-slot="tabs-content" className={cn("flex-1 outline-none", className)} {...props} />
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
```

- [ ] **Step 2: Campaign page** (`C/monitorings/[id]/page.tsx`, `"use client"`). Behaviour:
  - Find the campaign in `useList_MonitoringType_API()` by `Number(id)`. While loading, show `LoadingState`; if not found, show an `Alert` "Monitoring not found" with a link back.
  - `PageHeader`:
    - breadcrumbs `<ConsoleBreadcrumbs parent={{ href: "/console/monitorings", label: tNav("campaigns") }} />`;
    - title = localized name;
    - staff actions: `Link` "Edit definition" → `/console/monitorings/${id}/edit`, and `Link` "Upload Excel" → `/console/monitorings/upload?campaign=${id}`.
  - `tab = searchParams.get("tab") === "records" ? "records" : "uploads"`. `<Tabs dir={useDirection()} value={tab} onValueChange={(v) => replaceParam("tab", v)}>`, where `replaceParam` uses `router.replace` with an updated `URLSearchParams`, like `setRange` in the patient page.
  - **Uploads tab**:
    - `const uploads = campaignUploads(useList_SBHM_API().data ?? [], campaign.slug)`, then `const { selected, requestedMissing } = pickUpload(uploads, searchParams.get("upload"))`.
    - No uploads: an empty state with `t("noUploads")`, plus the staff upload link.
    - `requestedMissing` with a `selected` upload: a muted `Alert` saying `t("uploadMissing")`.
    - Picker: a `Select` (value `String(selected.id)`, `onValueChange` → `replaceParam("upload", v)`). Each item reads `${localeDigits(u.name, locale)} · ${localeDigits(formatDate(new Date(u.created_at), locale), locale)}`. Staff get a delete button beside it that opens the default export of `C/saderat-bank-health-monitoring/_delete-excel-dialog/dialog.tsx` with `data={selected}`, `open={deleting}` and `onOpenChange={setDeleting}`. Its `data` prop is `SBHM_ListSerializer[number]`, which is the upload list item.
    - Body: `campaign.slug === "step_1"` → `<Step1Report key={selected.id} uploadId={selected.id} personHref={(nid) => CAMPAIGN_PATIENT_PATH(campaign.id, nid)} />`; `"step_2"` → `Step2Report` with the same props; otherwise `<UploadRowsTable … />`.
  - **Records tab**: `<RecordsPanel monitoringId={campaign.id} />`. In `RecordsPanel`, the national-ID link (added in the patient page work) becomes `CAMPAIGN_PATIENT_PATH(monitoringId, record.national_id)`.

- [ ] **Step 3: Messages** (`/console/monitorings.Campaign`, both files):

| key | en | fa |
|---|---|---|
| uploadsTab | Excel uploads | فایل‌های اکسل |
| recordsTab | Entered records | اطلاعات ثبت‌شده |
| editDefinition | Edit definition | ویرایش تعریف |
| uploadExcel | Upload Excel | بارگذاری اکسل |
| chooseUpload | Excel upload | فایل اکسل |
| noUploads | No Excel has been uploaded to this monitoring yet. | هنوز فایل اکسلی برای این پایش بارگذاری نشده است. |
| uploadMissing | That upload is not in this monitoring; showing the latest instead. | آن فایل در این پایش نیست؛ آخرین فایل نمایش داده می‌شود. |
| notFound | Monitoring not found | پایش پیدا نشد |
| backToList | Back to monitorings | بازگشت به پایش‌ها |
| deleteUpload | Delete this upload | حذف این فایل |
| loadingRows | Loading rows… | در حال بارگذاری ردیف‌ها… |
| rowsError | The rows could not be loaded. | ردیف‌ها بارگذاری نشد. |
| noRows | This upload has no rows. | این فایل ردیفی ندارد. |
| searchRows | Search rows | جستجو در ردیف‌ها |
| rowCount | {shown} of {total} rows | {shown} از {total} ردیف |

`metadata.campaign`: en `{"title": "Monitoring", "description": "One monitoring's uploads and records."}`, fa `{"title": "پایش", "description": "فایل‌ها و اطلاعات ثبت‌شده یک پایش."}`.

- [ ] **Step 4: Records redirect.** `C/monitorings/[id]/records/page.tsx` becomes:

```tsx
import { redirect } from "@/i18n/navigation";

export default async function Page(props: PageProps<"/[locale]/console/monitorings/[id]/records">) {
  const { locale, id } = await props.params;
  redirect({ href: `/console/monitorings/${id}?tab=records`, locale });
}
```

(`@/i18n/navigation` exports `redirect`, created by `createNavigation`.) The `records/new` and `records/[recordId]/edit` routes stay. Their `_shell.tsx` breadcrumb trail becomes `[{ href: "/console/monitorings", label: tNav("campaigns") }, { href: \`/console/monitorings/${monitoringId}?tab=records\`, label: <campaign name or t("PageTitle")> }]`.

- [ ] **Step 5: Verify in the browser** (staff, fa and en, desktop and 390px):
  - Step 2 campaign: picker lists "Azar 1405", "Aban 1405", "Mehr 1405" newest first; charts render; clicking a bar opens the sheet; a person link goes to `/console/monitorings/2/patients/<nid>`.
  - `?upload=<id of a step_1 upload>` on the Step 2 campaign shows the notice and the latest Step 2 upload.
  - A campaign with no uploads shows `noUploads`.
  - "Blood pressure check" with a seeded upload shows the rows table, and search filters it.
  - The records tab lists the records; `/console/monitorings/3/records` lands on `?tab=records`.
  - As viewer: no edit, upload or delete controls, but charts and records are visible.

- [ ] **Step 6: Commit** `feat: campaign page with upload picker, charts or rows, and records`

### Task 12: Redirects from the old Excel routes

**Files:**
- Create: `C/monitorings/_reports/use-upload-campaign.ts`
- Replace: `C/saderat-bank-health-monitoring/page.tsx` (→ `/console/monitorings`)
- Replace: `C/saderat-bank-health-monitoring/step-1/[id]/page.tsx` and `step-2/[id]/page.tsx` (→ campaign page with `?upload=`)
- Delete: `C/saderat-bank-health-monitoring/_report/` (`ReportFrame`, now unused; grep first)

**Interfaces:**
- Produces: `useUploadCampaign(uploadId: number): { campaignId?: number; isPending: boolean; isError: boolean }`. It resolves the upload's `type` slug to the campaign's id via `useList_MonitoringType_API`.

- [ ] **Step 1: The hook**

```ts
"use client";
import { useRetrieve_SBHM_API } from "@/data/saderat-bank-health-monitoring/api/retrieve";
import { useList_MonitoringType_API } from "@/data/monitoring-type/api";

/** The campaign (MonitoringType id) an upload belongs to. */
export const useUploadCampaign = (uploadId: number) => {
  const upload = useRetrieve_SBHM_API({ input: { pathVariables: { id: uploadId } } });
  const types = useList_MonitoringType_API();
  const campaignId = types.data?.find((t) => t.slug === upload.data?.type)?.id;
  return { campaignId, isPending: upload.isPending || types.isPending, isError: upload.isError || types.isError };
};
```

- [ ] **Step 2: Redirect pages.** Each old step page becomes a client component: call `useUploadCampaign(Number(id))`; when `campaignId` is known, `router.replace(\`/console/monitorings/${campaignId}?upload=${id}\`)` inside a `useEffect` guarded by a ref, like `(authenticated)/layout.tsx`. Render `<LoadingState />` meanwhile, and an `Alert` with a link to `/console/monitorings` on error. The list page `saderat-bank-health-monitoring/page.tsx` does a server `redirect` to `/console/monitorings`, like Task 11 Step 4.

- [ ] **Step 3: Verify in the browser.**
  - `/fa/console/saderat-bank-health-monitoring/step-2/4` lands on `/fa/console/monitorings/2?upload=4`.
  - `/fa/console/saderat-bank-health-monitoring` lands on `/fa/console/monitorings`.
  - A non-existent upload id shows the error with the link.

- [ ] **Step 4: Commit** `feat: old Excel report addresses redirect into their campaign`

---

## Slice 4: Patient in campaign

### Task 13: Person views become components

**Files:**
- Move: `C/saderat-bank-health-monitoring/step-1/[id]/[national_id]/page.tsx` → `C/monitorings/_reports/step-1-person.tsx`, exported `Step1PersonSections({ row }: { row: MonitoringData })`
- Modify: `C/saderat-bank-health-monitoring/step-2/[id]/[national_id]/page.tsx` (export its `RecordSections`) → move `RecordSections` into `C/monitorings/_reports/step-2-person.tsx` as `Step2PersonSections({ row }: { row: SBHM_Step2Record })`
- Create: `C/monitorings/_reports/field-list.tsx` (`FieldList({ row }: { row: Record<string, unknown> })`)

**Interfaces:**
- Produces: `Step1PersonSections`, `Step2PersonSections`, `FieldList`. Each renders only the person's findings: no header card, no EHR table, no monitoring records.

- [ ] **Step 1: Step 1.** `git mv` the person page. In the moved file:
  - Delete the header card, the EHR fetching (`useEHRByNationalNumberApi`, `usePersonEhr`, `EhrRecordsTable`, `EhrTrendDialog`, `useRecordDetail`, `ServiceDetailsTable` and the sheet using it), `PatientRecordsSection`, `PatientPageLink`, and the route-context lookup.
  - Keep every findings section exactly as rendered, fed from the `row` prop instead of `person_data`: rename `person_data` to `row` throughout.
  - The loading, not-found and error branches go; the caller handles them.
  - Keep the `MonitoringData` type import. The old route file is deleted here (Task 15 recreates it as a redirect).

- [ ] **Step 2: Step 2.** Move `RecordSections` (lines 44-~135 of the step-2 person page) with its imports into `step-2-person.tsx` as `Step2PersonSections`. Delete the old step-2 person page (Task 15 recreates it as a redirect).

- [ ] **Step 3: Field list** for campaigns without a layout:

```tsx
"use client";
import { useLocale } from "next-intl";
import { formatCellValue } from "@/lib/utils";

/** A person's row from an upload with no layout: every non-empty column. */
export const FieldList = ({ row }: { row: Record<string, unknown> }) => {
  const locale = useLocale();
  const entries = Object.entries(row).filter(([, v]) => v !== null && v !== undefined && v !== "");
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
      {entries.map(([key, value]) => (
        <div key={key} className="min-w-0">
          <dt className="text-sm text-muted-foreground">{key}</dt>
          <dd className="font-medium break-words">{formatCellValue(String(value), locale)}</dd>
        </div>
      ))}
    </dl>
  );
};
```

- [ ] **Step 4: Verify.** `npx tsc --noEmit` (the old person routes are gone, so any links to them must already point elsewhere: grep for `step-1/${` and `step-2/${` template URLs and confirm only the Task 10 wrappers and redirects remain). Lint: the moved Step 1 file must not gain errors.

- [ ] **Step 5: Commit** `refactor: person findings render from a row prop`

### Task 14: Patient-in-campaign page

**Files:**
- Create: `C/monitorings/[id]/patients/[national_id]/page.tsx`, and `layout.tsx` (metadata key `campaignPatient`)
- Messages: namespace `/console/monitorings.CampaignPatient`, plus `metadata.campaignPatient`

**Interfaces:**
- Consumes:
  - `useList_PersonReports_API({ nationalId, monitoring })` (Task 5);
  - `Step1PersonSections`, `Step2PersonSections`, `FieldList` (Task 13);
  - `useList_PatientRecord_API` + `PatientRecordsContent`;
  - `fullNationalId`, `isNationalId`, `PATIENT_PATH`.
- Produces: `/console/monitorings/[id]/patients/[national_id]`.

- [ ] **Step 1: The page** (`"use client"`):
  - `nationalId = fullNationalId(decodeURIComponent(national_id))`. If invalid, show the same invalid state as the patient page.
  - `campaign` from `useList_MonitoringType_API()` by id; `reports = useList_PersonReports_API({ nationalId, monitoring: campaign?.id, enabled: !!campaign })`; `records = useList_PatientRecord_API({ nationalId, authorized: true })`, then filter `records.data` to `r.monitoring.id === campaign.id`.
  - `name` = `${row["نام"] ?? ""} ${row["نام خانوادگی"] ?? ""}`.trim() from the first returned row, else `t("fallbackTitle")`.
  - `PageHeader`:
    - breadcrumbs trail `[{ href: "/console/monitorings", label: tNav("campaigns") }, { href: \`/console/monitorings/${campaign.id}\`, label: campaignName }]`;
    - title `name`;
    - description `t("nationalId", { id: localeDigits(nationalId, locale) })`;
    - actions `<Button asChild variant="outline"><Link href={PATIENT_PATH(nationalId)}><User …/>{t("healthRecord")}</Link></Button>`.
  - For each report (newest first), a `Card` titled `${upload name} · ${date}`. Inside, render each of `report.rows` with `Step1PersonSections`, `Step2PersonSections` or `FieldList` by `campaign.slug`. Several rows in one upload get a `Badge` `t("rowIndex", { index })`, as the old Step 2 page did.
  - Then `<PatientRecordsContent records={{ ...records, data: filtered }} editable={isStaff} />`.
  - Empty (no reports and no records): `t("nothing")`.

- [ ] **Step 2: Messages** (`/console/monitorings.CampaignPatient`):

| key | en | fa |
|---|---|---|
| fallbackTitle | Patient | بیمار |
| nationalId | National ID {id} | کد ملی {id} |
| healthRecord | Health record | پرونده سلامت |
| rowIndex | Row {index} | ردیف {index} |
| nothing | This patient has no data in this monitoring. | این بیمار در این پایش اطلاعاتی ندارد. |
| loadError | This patient's monitoring data could not be loaded. | اطلاعات پایش این بیمار بارگذاری نشد. |

`metadata.campaignPatient`: en `{"title": "Patient in monitoring", "description": "One patient's data within one monitoring."}`, fa `{"title": "بیمار در پایش", "description": "اطلاعات یک بیمار در یک پایش."}`.

- [ ] **Step 2b: Records section for viewers.** In `src/components/app/patient-records-section.tsx`, `PatientRecordsSection` should fetch with `authorized: true` always and pass `editable={isStaff}` using `useIsStaff()`. Its `authorized` prop is removed and its callers updated (grep `PatientRecordsSection`).

- [ ] **Step 3: Verify in the browser** as staff and viewer:
  - `/fa/console/monitorings/2/patients/0012345678` shows Ali Rezaei's rows from both Step 2 uploads, with the legacy numeric one included.
  - `/fa/console/monitorings/3/patients/0012345678` shows the blood-pressure form record.
  - The "Health record" button opens the patient page.
  - `/fa/console/monitorings/2/patients/۱۲۳۴۵۶۷۸` works the same as `0012345678`.

- [ ] **Step 4: Commit** `feat: patient-in-campaign page`

### Task 15: «پایش‌های این بیمار» and the person redirects

**Files:**
- Create: `C/patients/[national_id]/_patient-campaigns.tsx` (`PatientCampaignsCard({ nationalId })`)
- Delete: `C/patients/[national_id]/_excel-reports.tsx`
- Modify: `C/patients/[national_id]/page.tsx` (swap the card; remove `PatientRecordsSection`, since form records now live in the campaign)
- Recreate: `C/saderat-bank-health-monitoring/step-1/[id]/[national_id]/page.tsx` and the step-2 one as redirects to `CAMPAIGN_PATIENT_PATH(campaignId, national_id)` using `useUploadCampaign`
- Messages: `/console/patients.PatientPage`: replace the `excel*` keys with the `campaigns*` keys below

**Interfaces:**
- Consumes: `useList_PersonReports_API({ nationalId })` (items carry `monitoring`), `useList_PatientRecord_API`, `CAMPAIGN_PATIENT_PATH`.

- [ ] **Step 1: The card.**
  - Build a map by campaign id: from person reports, each item's `monitoring` with its upload count; from patient records, each record's `monitoring` with a record flag.
  - Render one row per campaign: localized name, a muted line `t("campaignSummary", { uploads, records })`, and an "Open" link to `CAMPAIGN_PATIENT_PATH(id, nationalId)`.
  - Handle loading (Skeleton), error with retry for either query, and empty (`t("campaignsEmpty")`).
  - It is visible to every console user (no `isStaff` gate).

| key | en | fa |
|---|---|---|
| campaignsTitle | This patient's monitorings | پایش‌های این بیمار |
| campaignsDescription | Monitorings with an Excel row or entered data for this patient. | پایش‌هایی که ردیف اکسل یا اطلاعات ثبت‌شده برای این بیمار دارند. |
| campaignsEmpty | This patient is in no monitoring. | این بیمار در هیچ پایشی نیست. |
| campaignsError | Monitorings could not be loaded. | پایش‌ها بارگذاری نشد. |
| campaignSummary | {uploads} Excel rows · {records} entered records | {uploads} ردیف اکسل · {records} اطلاعات ثبت‌شده |

- [ ] **Step 2: Person redirects.** Both `step-N/[id]/[national_id]/page.tsx` files become client redirects: `useUploadCampaign(Number(id))` → `router.replace(CAMPAIGN_PATIENT_PATH(campaignId, national_id))`, with the same loading and error handling as Task 12.

- [ ] **Step 3: Verify in the browser.**
  - The patient page shows «پایش‌های این بیمار» listing Step 2 (2 Excel rows) and Blood pressure check (1 record).
  - Each "Open" goes to the right patient-in-campaign page.
  - The old `/fa/console/saderat-bank-health-monitoring/step-2/4/0012345678` redirects to `/fa/console/monitorings/2/patients/0012345678`.
  - A viewer sees the card.

- [ ] **Step 4: Commit** `feat: patient page lists the patient's monitorings; old person links redirect`

---

## Slice 5: EHR tabs and quick access

### Task 16: EHR results per record type, without the global dialog

**Files:**
- Modify: `C/saderat-bank-health-monitoring/_ehr/use-person-ehr.ts` (export `buildPersonEhr` taking `{ lab?, reports }`)
- Create: `C/patients/[national_id]/use-patient-ehr-tabs.ts`
- Modify: `N/src/app/_side-effects/network-error.ts` (honour `meta.silentNetworkError`)

**Interfaces:**
- Produces:
  - `buildPersonEhr({ lab, reports }: { lab?: UseQueryResult<EHRByNationalNumberApiResponse, unknown>; reports: UseQueryResult<EHRByNationalNumberApiResponse, unknown>[] }): PersonEhr`
  - `usePatientEhrTabs({ nationalId, range, enabled }): { settled: boolean; tabs: { type: PatientType; ehr: PersonEhr }[]; failed: { type: PatientType; retry: () => void }[] }`
  - Query meta `{ silentNetworkError: true }` is skipped by the global network-error dialog.

- [ ] **Step 1: `buildPersonEhr`.** Change its signature to the object form above. Inside, replace `const [labQuery, ...reportQueries] = results;` with `const labQuery = lab; const reportQueries = reports;`, and `const failed = results.find(…)` with `[lab, ...reports].filter(Boolean).find(…)`. Update `usePersonEhr`'s `combine` to `(results) => buildPersonEhr({ lab: results[0], reports: results.slice(1) })`. Export `buildPersonEhr`. Add `meta: { silentNetworkError: true }` to each query in `usePersonEhr`.

- [ ] **Step 2: The hook.**

```ts
"use client";
import React from "react";
import { useQueries } from "@tanstack/react-query";
import { format } from "date-fns-jalali";
import { PatientType, PATIENT_TYPE_ORDER } from "@/components/app/patient-type-selector";
import { EHR_BY_NATIONAL_NUMBER_KEY, ehr_by_national_number } from "@/data/electronic health record/api/EHR-by-national-number";
import { buildPersonEhr } from "../../saderat-bank-health-monitoring/_ehr/use-person-ehr";

/** Every EHR record type for one patient, loaded together; tabs only for types with rows. */
export const usePatientEhrTabs = ({ nationalId, range, enabled }: {
  nationalId: string; range: { from: Date; to: Date }; enabled: boolean;
}) => {
  const fromDate = format(range.from, "yyyy/MM/dd");
  const toDate = format(range.to, "yyyy/MM/dd");
  const results = useQueries({
    queries: PATIENT_TYPE_ORDER.map((patientType) => ({
      queryKey: [EHR_BY_NATIONAL_NUMBER_KEY, nationalId, patientType, fromDate, toDate],
      queryFn: () => ehr_by_national_number({ params: { nationalNumber: nationalId, fromDate, toDate, patientType } }),
      enabled,
      staleTime: 5 * 60 * 1000,
      meta: { silentNetworkError: true },
    })),
  });
  return React.useMemo(() => {
    const settled = results.every((r) => !r.isPending || !enabled);
    const tabs = PATIENT_TYPE_ORDER.flatMap((type, i) => {
      const r = results[i];
      if (!r.data?.length) return [];
      const ehr = type === PatientType.LAB ? buildPersonEhr({ lab: r, reports: [] }) : buildPersonEhr({ reports: [r] });
      return [{ type, ehr }];
    });
    const failed = PATIENT_TYPE_ORDER.flatMap((type, i) =>
      results[i].isError ? [{ type, retry: () => void results[i].refetch() }] : []);
    return { settled, tabs, failed };
  }, [results, enabled]);
};
```

In `src/components/app/patient-type-selector.tsx`, change `const PATIENT_TYPE_ORDER: PatientType[] = [` to `export const PATIENT_TYPE_ORDER: PatientType[] = [` (the eight types in render order). `EHR_BY_NATIONAL_NUMBER_KEY` and `ehr_by_national_number` are already exported from `EHR-by-national-number.ts`.

- [ ] **Step 3: Global dialog opt-out.** In `network-error.ts`, in the query-cache subscriber, change the condition to:

```ts
if (isAxiosError(error) && error.code === "ERR_NETWORK" && !event.query.meta?.silentNetworkError) {
```

Declare the meta type once in `src/app/provider.tsx` or a `react-query.d.ts`:

```ts
import "@tanstack/react-query";
declare module "@tanstack/react-query" {
  interface Register { queryMeta: { silentNetworkError?: boolean } }
}
```

- [ ] **Step 4: Verify.** `npx tsc --noEmit`. Browser: the Step 2 person view and the patient page no longer open the global dialog when the EHR is unreachable (locally it always is). Stopping Django briefly and loading `/fa/console/monitorings` still opens it.

- [ ] **Step 5: Commit** `feat: EHR per record type, errors kept inside their section`

### Task 17: EHR tabs on the patient page

**Files:**
- Modify: `C/patients/[national_id]/page.tsx`
- Messages: `/console/patients.PatientPage`: add `tabsLoading`, `ehrEmpty`, `ehrFailed`; remove the `serviceReport*` keys

**Interfaces:**
- Consumes: `usePatientEhrTabs` (Task 16), `Tabs*` (Task 11), `EhrRecordsTable`, `EhrTrendDialog`, `useRecordDetail`, `common.PatientTypes` labels: `const tPatientTypes = useTranslations("common.PatientTypes")`, then `tPatientTypes(type)` with the enum value as the key, as `C/electronic-health-record/client.tsx:153` does.

- [ ] **Step 1: Replace the EHR card body.**
  - Not settled: a row of 3 `Skeleton` pills with `role="status"` and `t("tabsLoading")`.
  - Settled with `tabs.length === 0` and no failures: `t("ehrEmpty")`.
  - Otherwise: `<Tabs dir={dir} defaultValue={String(tabs[0].type)}>`, a `TabsList` with one `TabsTrigger` per tab labelled by the patient type, and a `TabsContent` with `<EhrRecordsTable ehr={tab.ehr} onViewRecord={recordDetail.open} onSelectSeries={setSelectedSeries} />`.
  - For each `failed` entry: an inline `Alert` `t("ehrFailed", { type: <label> })` with a retry `Button` calling `retry`.
- Delete the "Service report by record type" card and its `serviceReportHref`. Remove the `usePersonEhr` call from this page.

| key | en | fa |
|---|---|---|
| tabsLoading | Loading health record types… | در حال بارگذاری انواع پرونده… |
| ehrEmpty | No EHR records in this date range. | در این بازه سابقه‌ای در پرونده الکترونیک نیست. |
| ehrFailed | {type} records could not be loaded. | سوابق {type} بارگذاری نشد. |

- [ ] **Step 2: Verify.** Locally every type fails, so the page shows 8 inline errors with retry buttons, no global dialog, and the monitorings card still works. Check fa, en and 390px. The tab rendering needs a post-deploy check: note it in the handoff.

- [ ] **Step 3: Commit** `feat: patient page shows EHR by record type`

### Task 18: National-ID box, and patient reports retired

**Files:**
- Modify: `C/electronic-health-record/client.tsx` (a form above the table)
- Move: `ServiceDetailsTable` from `C/patient-reports/client.tsx` into `C/saderat-bank-health-monitoring/_ehr/service-details-table.tsx` if anything still imports it. After Task 13 the Step 1 person view no longer does: grep, and if nothing imports it, don't move it.
- Replace: `C/patient-reports/page.tsx` with a redirect to `/console/patients/<nationalNumber>` (or to `/console/electronic-health-record` when absent)
- Delete: `C/patient-reports/client.tsx`, `provider.tsx`, `_form/`, `_charts/` (after grep confirms no importers); remove `metadata.patientReports` and the `/console/patient-reports` messages namespace if nothing uses them (check-messages confirms)
- Messages: `/console/electronic-health-record.EHRTable`: `openPatientLabel`, `openPatientPlaceholder`, `openPatientAction`, `openPatientInvalid`

**Interfaces:**
- Consumes: `fullNationalId`, `isNationalId`, `PATIENT_PATH`.

- [ ] **Step 1: The box.** Above the table, add a `<form>` with an `Input` (`inputMode="numeric"`, `dir="ltr"`, `aria-label={t("openPatientLabel")}`) and a submit `Button` `t("openPatientAction")`. On submit:
  - `const id = fullNationalId(value)`;
  - if `isNationalId(id)`, `router.push(PATIENT_PATH(id))`;
  - otherwise show `t("openPatientInvalid")` under the input (with `aria-live="polite"`).

| key | en | fa |
|---|---|---|
| openPatientLabel | Open a patient by national ID | باز کردن بیمار با کد ملی |
| openPatientPlaceholder | National ID | کد ملی |
| openPatientAction | Open | باز کردن |
| openPatientInvalid | A national ID has 10 digits. | کد ملی ۱۰ رقم است. |

- [ ] **Step 2: Retire patient reports.** The redirect page:

```tsx
import { redirect } from "@/i18n/navigation";
import { fullNationalId, isNationalId } from "@/lib/national-id";

export default async function Page(props: PageProps<"/[locale]/console/patient-reports">) {
  const { locale } = await props.params;
  const raw = (await props.searchParams).nationalNumber;
  const id = fullNationalId(Array.isArray(raw) ? raw[0] : raw);
  redirect({ href: isNationalId(id) ? `/console/patients/${id}` : "/console/electronic-health-record", locale });
}
```

Delete `C/patient-reports/layout.tsx` only if it carries nothing but metadata. Then grep `patient-reports` across `src` and fix leftovers; `/console/patient-reports` stays in `activePrefixes` harmlessly or can be removed.

- [ ] **Step 3: Full verification pass** (the one batched browser round):
  - `npx tsc --noEmit` = 0; `node scripts/check-messages.mjs` passes; `node --test --experimental-strip-types tests/*.test.mjs` passes; the lint comparison on every file changed across the branch (`git diff --name-only feat/patient-page...HEAD`) shows no increase.
  - Django: `manage.py test --noinput` = OK.
  - Browser (fa and en; 1366 and 390; staff, viewer and patient), each route loads with the right sidebar highlight:
    - `/console`
    - `/console/electronic-health-record`: typing `۱۲۳۴۵۶۷۸` and pressing Enter opens `/console/patients/0012345678`
    - `/console/periodical-reports`
    - `/console/patients/0012345678`
    - `/console/monitorings`
    - `/console/monitorings/2`
    - `/console/monitorings/2?tab=records`
    - `/console/monitorings/2/patients/0012345678`
    - `/console/monitorings/upload`
    - `/console/monitorings/new`
    - `/console/record-monitoring`
    - `/console/form-sabt-payesh`
    - The old `/console/saderat-bank-health-monitoring/...` and `/console/patient-reports?...` redirect.
  - Viewer: the staff items are absent, and the staff routes show "Staff access required".
  - Patient portal sign-in still works.

- [ ] **Step 4: Commit** `feat: open a patient by national ID; retire patient reports`

---

## After the plan

Merge order when the user approves:
1. Django `feat/two-sections` into `app-journeys`.
2. Next.js `fix/journey-gaps` → `feat/patient-page` → `feat/two-sections` into `app-journeys`.

Nothing is pushed or deployed without the user's say-so.

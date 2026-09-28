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
  - `export PYTHONPATH=<scratchpad>/wt DJANGO_SETTINGS_MODULE=walk_settings`
  - `<scratchpad>/wt/walk_settings.py` imports development settings and sets `DATABASES["default"]["PORT"]="55432"`.
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

1. **A national ID typed with Persian digits or missing leading zeros** (`۰۰۱۲۳۴۵۶۷۸`, `12345678`) in any new route or box must open the same patient as `0012345678`. Pinned in Task 6 (`tests/national-id.test.mjs`) and Task 18 (browser).
2. **A campaign with no uploads, no records, or an upload with zero rows** must show an empty state, never a blank area or a crash. Pinned in Task 6 (`pickUpload([])`) and Task 11 (browser).
3. **`?upload=` naming an upload that belongs to another campaign or was deleted** must fall back to the newest upload of this campaign, with a notice. Pinned in Task 6 (`pickUpload` tests) and Task 11.
4. **A viewer opening a staff route by URL, or a patient account calling any console endpoint**: the viewer sees "Staff access required" and no write controls; the patient gets 403. Pinned in Task 1 (Django tests) and Task 8/11 (browser).
5. **An upload for a campaign without a chart layout that has no national-ID column** must still render as a table, with rows that are not links. Pinned in Task 6 (`findNationalIdColumn`) and Task 10.

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

### Task 3: Upload column check, and the upload returns its id

**Files:**
- Modify: `D/saderatBankHealthMonitoring/serializers.py` (`SaderatBankHealthMonitoringUploadExcelSerializer.create`)
- Modify: `D/saderatBankHealthMonitoring/views.py` (`upload_excel` returns `{'message', 'id'}`; update the `inline_serializer` to add `'id': drf_serializers.IntegerField()`)
- Create: `D/saderatBankHealthMonitoring/layouts.py`
- Test: `D/saderatBankHealthMonitoring/test_upload_layout.py`

**Interfaces:**
- Produces:
  - `LAYOUT_COLUMNS: dict[str, tuple[str, ...]]`.
  - The upload responds `{"message": str, "id": int}`.
  - A missing-column failure responds `400 {"file": ["Missing columns for this monitoring: A, B"]}`.

A layout's signature columns are the national-ID column plus columns only that layout's spreadsheet has. Requiring every chart column would reject a valid sheet that lacks one optional lab test; the signature is enough to catch the wrong kind of file.

- [ ] **Step 1: Write the failing tests** in `test_upload_layout.py`:

```python
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase

from .models import MonitoringType, SaderatBankHealthMonitoring
from .tests import excel_upload

STEP_1_ROW = {'personel.کد ملی': '0012345678', 'BMI_Group': 'n', 'BP_Group': 'n', 'name_goroh': 'g'}
STEP_2_ROW = {'کد ملی': '0012345678', 'علائم عمومي': 'x', 'Heart rate:': 70, 'Respiratory rate': 16}


class UploadLayoutTests(APITestCase):
    def setUp(self):
        staff = get_user_model().objects.create_user('op', password='pw', is_staff=True)
        self.client.force_authenticate(staff)

    def upload(self, type_slug, rows, name='Sheet'):
        return self.client.post(reverse('monitorings-upload-excel'),
                                {'name': name, 'type': type_slug, 'file': excel_upload(rows)},
                                format='multipart')

    def test_matching_sheet_is_saved_and_returns_its_id(self):
        response = self.upload('step_2', [STEP_2_ROW])
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['id'], SaderatBankHealthMonitoring.objects.get(name='Sheet').id)

    def test_step_2_sheet_into_step_1_is_refused_naming_the_columns(self):
        response = self.upload('step_1', [STEP_2_ROW])
        self.assertEqual(response.status_code, 400)
        message = response.data['file'][0]
        for column in ('personel.کد ملی', 'BMI_Group', 'BP_Group', 'name_goroh'):
            self.assertIn(column, message)
        self.assertFalse(SaderatBankHealthMonitoring.objects.filter(name='Sheet').exists())

    def test_campaign_without_layout_accepts_any_columns(self):
        MonitoringType.objects.create(slug='bp', name_en='BP', name_fa='فشار')
        self.assertEqual(self.upload('bp', [{'anything': 1}]).status_code, 200)
```

- [ ] **Step 2: Run to verify it fails.** Expected: `KeyError: 'id'` and a 200 where 400 is expected.

- [ ] **Step 3: Implement.** Create `layouts.py`:

```python
"""Columns that identify a monitoring's spreadsheet layout.

Only monitorings the dashboard draws charts for have a layout. A sheet
uploaded to one of them must carry these columns, or its charts would be
empty; the list is a signature, not every column a chart reads.
"""

LAYOUT_COLUMNS = {
    'step_1': ('personel.کد ملی', 'BMI_Group', 'BP_Group', 'name_goroh'),
    'step_2': ('کد ملی', 'علائم عمومي', 'Heart rate:', 'Respiratory rate'),
}


def missing_layout_columns(slug, columns):
    """The signature columns of `slug`'s layout absent from `columns`, in order."""
    present = set(columns)
    return [c for c in LAYOUT_COLUMNS.get(slug, ()) if c not in present]
```

In the upload serializer's `create`, right after `df = pd.read_excel(file, dtype=string_columns)` and before converting the rows, add:

```python
            missing = missing_layout_columns(type.slug, df.columns)
            if missing:
                raise serializers.ValidationError({'file': [
                    'Missing columns for this monitoring: ' + ', '.join(missing)]})
```

Import `from .layouts import missing_layout_columns`. The surrounding `except Exception as e` would rewrap this error, so either add `except serializers.ValidationError: raise` before it, or run the check after the `try` block using the parsed `df`. Pick the second. Keep `df` in scope by initialising it inside `try` and checking right after the `try/except`, before `SaderatBankHealthMonitoring.objects.create`.

In `views.py` `upload_excel`, use `instance = serializer.save()` and `return Response({'message': 'Excel uploaded successfully', 'id': instance.id})`. Update its `inline_serializer` fields to include `'id': drf_serializers.IntegerField()`.

- [ ] **Step 4: Run the suite.** Expected: `OK`. `UploadKeepsNationalIdZerosTests` still passes: its row has `کد ملی` and uses `step_2`, so add `'علائم عمومي': 'x', 'Heart rate:': 70, 'Respiratory rate': 16` to that test's row.

- [ ] **Step 5: Commit** `feat: refuse spreadsheets that do not match a monitoring's layout`

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
  - `useUploadExcelApi` is typed to return `{ message: string; id: number }`.

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

In `upload-excel.ts`, change the mutation's data type from `void` to `{ message: string; id: number }` in `UseMutationOptions<…>`, and type `upload_excel` as returning `Promise<{ message: string; id: number }>`.

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

- [ ] **Step 1: Write the failing tests.** `tests/national-id.test.mjs`:

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

- [ ] **Step 2: Run to verify they fail.** `node --test --experimental-strip-types tests/national-id.test.mjs tests/campaign.test.mjs`. Expected: FAIL. `national-id.ts` cannot resolve `@/components/schema-form/types`, and `campaign.ts` does not exist.

- [ ] **Step 3: Implement.** In `src/lib/national-id.ts`, replace `import { toDigits } from "@/components/schema-form/types";` with a local function, and add the campaign path:

```ts
/** Persian and Arabic-Indic digits to ASCII, everything else dropped. */
export const asciiDigits = (raw: string) =>
  raw
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[^0-9]/g, "");
```

Change `fullNationalId` to `const digits = asciiDigits(String(raw ?? ""));`, and add:

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

- [ ] **Step 4: Run the tests and tsc.** Both test files pass; `npx tsc --noEmit` exits 0; `node --test --experimental-strip-types tests/patient-session.test.mjs` still passes.

- [ ] **Step 5: Commit** `feat: campaign and national id helpers with tests`

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
    - Show the server's `file` error through the existing `FormMessage` on the file field. The missing-columns message arrives as `{"file": [...]}` and lands there already.
  - `layout.tsx` carries metadata the way `C/patients/[national_id]/layout.tsx` does.

- [ ] **Step 2: Verify.**
  - `npx tsc --noEmit` and the message check.
  - Browser as staff:
    - upload a small xlsx to "Blood pressure check" → lands on `/fa/console/monitorings/3?upload=<id>`;
    - upload a Step 2 sheet to Step 1 → the file field shows "Missing columns…".
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

- [ ] **Step 4: Sheets.** In both `sheet.tsx` files add `personHref: (nationalId: string) => string;` to the props type. Replace each template-literal person URL with `personHref(nationalId)` (step 1: `personHref(String(row.original["personel.کد ملی"] ?? ""))`).

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

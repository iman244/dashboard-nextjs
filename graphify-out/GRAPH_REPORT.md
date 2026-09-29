# Graph Report - /Users/iman244/Repositories/mainreport/dashboard-nextjs  (2026-09-25)

## Corpus Check
- 276 files · ~430,173 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1336 nodes · 3778 edges · 112 communities (61 shown, 51 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 67 edges (avg confidence: 0.7)
- Token cost: not recorded by this session’s semantic subagents (AST extraction is deterministic).

## Community Hubs (Navigation)
- Electronic Record Views
- Electronic Record Data Flow
- Application Providers And State
- Design Token Checks
- Record Search And Filters
- Shared Sidebar Components
- Monitoring Delete Flow
- Project Dependencies
- Monitoring Field Builder
- Patient Monitoring Records
- TypeScript Configuration
- Persian UX Guidelines
- Console Page Layouts
- Monitoring Type API
- Application Architecture
- Fonts And Global Layout
- Schema Builder Drafts
- Component Configuration
- Project Planning Scripts
- Bank Report Detail Blocks
- Console Navigation Actions
- Account And Language Controls
- Patient Entry Delete API
- Patient Route Pages
- Authentication State
- Patient Entry List API
- Authentication UX Review
- Monitoring Field Drafts
- Monitoring Type And Entry Actions
- Bank Report Layouts
- Report Chart Configuration
- JWT Token Handling
- Bank Report Route Context
- Bank Report Distribution Charts
- Bank Report Notes And Types
- Application Shell Layout
- Loading And Route Layouts
- Monitoring Record Form
- Console Navigation Registry
- Runtime Dependencies
- Patient Portal Plan
- PowerShell Shared Helpers
- UI Breadcrumb Navigation
- Bank Detail Sections
- Authentication Redirect Routes
- Upload Presign API
- Current User Query
- Translation Message Checks
- Patient Portal Provider
- Button Group Components
- User Creation Mutation
- Generated API Schema
- Table Column Guidance
- JWT Authentication API
- Next Configuration
- Product Logo Asset
- Page Metadata Checks
- Electronic Record Route
- Monitoring Record Layout
- Patient Reports Route
- Periodical Reports Route
- Bank Step One Layout
- Bank Step Two Layout
- Patient Sign In
- External Form Layout
- Axios Dependency
- Cn Dependency
- Date Fns Dependency
- Date Fns Jalali Dependency
- Daypicker Persian Dependency
- Embla Carousel React Dependency
- ESLint Configuration
- Pre Push Dependency
- Check Before Deploy Dependency
- Hookform Resolvers Dependency
- Lucide React Dependency
- Next Dependency
- Next Intl Dependency
- Next Themes Dependency
- Persian Tools Persian Tools Dependency
- Radix Ui Dependency
- Radix Alert Dialog Dependency
- Radix Ui React Collapsible Dependency
- Radix Ui React Dialog Dependency
- Radix Dropdown Menu Dependency
- Radix Ui React Label Dependency
- Radix Ui React Popover Dependency
- Radix Ui React Select Dependency
- Radix Ui React Separator Dependency
- Radix Ui React Slot Dependency
- Radix Ui React Tooltip Dependency
- React Day Picker Dependency
- React Dom Dependency
- React Hook Form Dependency
- Recharts Dependency
- Sonner Dependency
- Tailwind Merge Dependency
- Tanstack React Table Dependency
- Zod Dependency
- PostCSS Configuration
- File Icon Asset
- Globe Icon Asset
- Next Logo Asset
- Vercel Logo Asset
- Window Icon Asset
- Project Constitution

## God Nodes (most connected - your core abstractions)
1. `cn()` - 146 edges
2. `react` - 81 edges
3. `localeDigits()` - 61 edges
4. `Button()` - 51 edges
5. `ElectronicHealthRecord` - 37 edges
6. `AppTableFeatures` - 35 edges
7. `pageMetadata()` - 33 edges
8. `useLocaleDigits()` - 31 edges
9. `apiInstance` - 22 edges
10. `formatDate()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `Calendar04()` --references--> `react`  [EXTRACTED]
  src/components/calendar-04.tsx → package.json
- `AuthProvider()` --references--> `react`  [EXTRACTED]
  src/app/_auth/provider.tsx → package.json
- `useAuth()` --references--> `react`  [EXTRACTED]
  src/app/_auth/provider.tsx → package.json
- `useJwtToken()` --references--> `react`  [EXTRACTED]
  src/app/_auth/useJwtToken.ts → package.json
- `GlobalProvider()` --references--> `react`  [EXTRACTED]
  src/app/_global/provider.tsx → package.json

## Import Cycles
- 3-file cycle: `src/app/_global/index.ts -> src/app/_global/provider.tsx -> src/app/_network-error/dialog.tsx -> src/app/_global/index.ts`
- 4-file cycle: `src/app/_global/index.ts -> src/app/_global/provider.tsx -> src/app/_network-error/dialog.tsx -> src/app/_side-effects/network-error.ts -> src/app/_global/index.ts`

## Hyperedges (group relationships)
- **Patient portal sign-in and records flow** — readme_patient_sign_in, readme_national_id_probe, readme_patient_session, readme_patient_records [EXTRACTED 1.00]
- **Staff authentication and console route flow** — app_architecture_diagram_authentication_route, app_architecture_diagram_login_form, app_architecture_diagram_login_mutation, app_architecture_diagram_redirect_to_console, app_architecture_diagram_console_route [EXTRACTED 1.00]
- **Patient portal session flow** — docs_superpowers_specs_2026_09_05_patient_portal_design_patient_sign_in_route, docs_superpowers_specs_2026_09_05_patient_portal_design_patient_session, docs_superpowers_specs_2026_09_05_patient_portal_design_patient_records_route, docs_superpowers_specs_2026_09_05_patient_portal_design_lean_patient_records_provider [EXTRACTED 1.00]

## Communities (112 total, 51 thin omitted)

### Community 0 - "Electronic Record Views"
Cohesion: 0.07
Nodes (73): Client(), EHRTable(), EHRTableProps, LoadingSkeleton(), LoadingSkeletonProps, DeleteRecordDialog(), RecordsPage(), columnHelper (+65 more)

### Community 1 - "Electronic Record Data Flow"
Cohesion: 0.05
Nodes (77): ElectronicHealthRecordContext, ElectronicHealthRecordContextProps, Provider(), ServiceCountData, PatientReportsContext, PatientReportsContextProps, PatientReportsFormValues, Provider() (+69 more)

### Community 2 - "Application Providers And State"
Cohesion: 0.06
Nodes (70): GlobalContext, GlobalProvider(), useGlobal(), GlobalContextType, Client(), LoginFormData, makeLoginSchema(), EHRFilterProps (+62 more)

### Community 3 - "Design Token Checks"
Cohesion: 0.09
Nodes (62): BAD(), bold(), CHART_CAT, CHART_DIV, CHART_SEQ, checkCategoricalDistinct(), checkContrast(), checkDiverging() (+54 more)

### Community 4 - "Record Search And Filters"
Cohesion: 0.09
Nodes (37): react, react, useEHRColumns(), EHRFilter(), makeFormSchema(), useElectronicHealthRecord(), chartConfig, ChartDataPoint (+29 more)

### Community 5 - "Shared Sidebar Components"
Cohesion: 0.08
Nodes (42): DropdownMenuCheckboxItem(), DropdownMenuShortcut(), Pagination(), PaginationContent(), PaginationEllipsis(), PaginationLink(), PaginationLinkProps, PaginationNext() (+34 more)

### Community 6 - "Monitoring Delete Flow"
Cohesion: 0.09
Nodes (32): InUse, DeleteSaderatBankHealthMonitoringExcelDialog(), UploadSaderatBankHealthMonitoringExcelDialog(), Calendar04(), AlertDialog(), AlertDialogAction(), AlertDialogCancel(), AlertDialogContent() (+24 more)

### Community 7 - "Project Dependencies"
Cohesion: 0.06
Nodes (34): eslint, eslint-config-next, @eslint/eslintrc, devDependencies, eslint, eslint-config-next, @eslint/eslintrc, shadcn (+26 more)

### Community 8 - "Monitoring Field Builder"
Cohesion: 0.14
Nodes (25): FieldEditor(), optionalNumber(), SchemaPreview(), DigitStringField(), AttachedImage, ImageField(), ImageStatus, ImageTile() (+17 more)

### Community 9 - "Patient Monitoring Records"
Cohesion: 0.11
Nodes (26): EditLink(), fieldHasContent(), filesOf(), fullNationalId(), hasContent(), PatientRecordsSection(), RecordBlock(), valueOf() (+18 more)

### Community 10 - "TypeScript Configuration"
Cohesion: 0.07
Nodes (27): dom, dom.iterable, esnext, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts (+19 more)

### Community 11 - "Persian UX Guidelines"
Cohesion: 0.11
Nodes (26): UI/UX Pass Wave 1 Implementation Plan, Persian-first bilingual RTL layout, Route-scoped en/fa translation parity, UI/UX Pass Charter, Abnormal-first patient record, EHR today-to-today default, Empty console front door, Logical CSS and document direction (+18 more)

### Community 12 - "Console Page Layouts"
Cohesion: 0.15
Nodes (18): metadata, Layout(), Layout(), PatientSessionContext, PatientSessionProvider(), usePatientSession(), clearStoredNationalId(), emit() (+10 more)

### Community 13 - "Monitoring Type API"
Cohesion: 0.13
Nodes (18): create(), MonitoringTypeCreateInput, useCreate_MonitoringType_API(), destroy(), MonitoringTypeDestroyInput, PATH(), PathVariables, useDestroy_MonitoringType_API() (+10 more)

### Community 14 - "Application Architecture"
Cohesion: 0.10
Nodes (22): User visits app, JWT authentication endpoints, Auth provider, Authentication status, Authentication route, useAuthorized, Console route, Django API and Djoser (+14 more)

### Community 15 - "Fonts And Global Layout"
Cohesion: 0.16
Nodes (16): geistMono, geistSans, RootLayout(), vazirmatn, Layout(), metadata, EhrTrendDialog(), AppSidebar() (+8 more)

### Community 16 - "Schema Builder Drafts"
Cohesion: 0.22
Nodes (12): draftProblems(), toPayload(), withIds(), TypeForm(), TypeFormBody(), StaffOnly(), asFieldSchema(), Alert() (+4 more)

### Community 17 - "Component Configuration"
Cohesion: 0.11
Nodes (18): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+10 more)

### Community 18 - "Project Planning Scripts"
Cohesion: 0.28
Nodes (18): Extract-PlanField(), Format-TechnologyStack(), Get-CommandsForLanguage(), Get-LanguageConventions(), Get-ProjectStructure(), Main(), New-AgentFile(), Parse-PlanData() (+10 more)

### Community 19 - "Bank Report Detail Blocks"
Cohesion: 0.25
Nodes (16): AFFIRMATIVE, BadgeItem(), ChecklistRows(), getStatusColor(), getStatusIcon(), isBlank(), parseChecklist(), SectionCard() (+8 more)

### Community 20 - "Console Navigation Actions"
Cohesion: 0.23
Nodes (12): columnHelper, columnHelper, DropdownMenu(), DropdownMenuContent(), DropdownMenuItem(), DropdownMenuLabel(), DropdownMenuPortal(), DropdownMenuSeparator() (+4 more)

### Community 21 - "Account And Language Controls"
Cohesion: 0.20
Nodes (15): NavUser(), LanguageMenuItems(), LanguageSwitcher(), LOCALE_NAMES, localeName(), LOCALES, useLocaleSwitcher(), ThemeMenuItems() (+7 more)

### Community 22 - "Patient Entry Delete API"
Cohesion: 0.14
Nodes (12): destroy(), PatientEntryDestroyInput, useDestroy_PatientEntry_API(), ApiInput, create(), useCreate_SBHM_API(), SBHM_CreateSerializer, JWT_VERIFY_KEY (+4 more)

### Community 23 - "Patient Route Pages"
Cohesion: 0.15
Nodes (7): generateMetadata(), generateMetadata(), generateMetadata(), generateMetadata(), generateMetadata(), generateMetadata(), pageMetadata()

### Community 24 - "Authentication State"
Cohesion: 0.27
Nodes (9): AuthContext, useAuth(), AuthContextType, AuthenticationStatus, Layout(), useOnLogin(), ButtonsSection(), safeNextPath() (+1 more)

### Community 25 - "Patient Entry List API"
Cohesion: 0.16
Nodes (10): PatientEntryListInput, PatientEntryUpdateInput, update(), useUpdate_PatientEntry_API(), FileFieldDefinition, PatientEntry, PatientEntry_PatchSerializer, PatientEntryFile (+2 more)

### Community 26 - "Authentication UX Review"
Cohesion: 0.14
Nodes (15): Authentication interstitial, Authentication layout 3000ms timer, Back navigation trap, next destination parameter, useOnLogin redirect effect, Post-login transition, EHRByNationalNumber upstream API, National ID EHR probe (+7 more)

### Community 27 - "Monitoring Field Drafts"
Cohesion: 0.32
Nodes (13): addField(), addSection(), moveField(), newId(), nextKey(), removeField(), removeSection(), updateField() (+5 more)

### Community 28 - "Monitoring Type And Entry Actions"
Cohesion: 0.23
Nodes (11): DeleteMonitoringTypeDialog(), NewRecordPage(), EditRecordPage(), RecordShell(), ApiResponse, list(), LIST_MONITORING_TYPE_QUERY_KEY(), useList_MonitoringType_API() (+3 more)

### Community 29 - "Bank Report Layouts"
Cohesion: 0.21
Nodes (6): generateMetadata(), generateMetadata(), generateMetadata(), MonitoringIdRouteProvider(), generateMetadata(), sectionMetadata()

### Community 30 - "Report Chart Configuration"
Cohesion: 0.22
Nodes (12): ChartSection, DistributionChartSpec, STEP2_CHART_FIELDS, STEP2_CHART_SECTIONS, countValues(), DistributionDatum, Step2Report, useStep2Report() (+4 more)

### Community 31 - "JWT Token Handling"
Cohesion: 0.24
Nodes (9): useJwtToken(), Actions, useLoadToken(), Actions, useRefreshTokenSetup(), jwt_refresh(), JWT_REFRESH_KEY, JwtRefreshApiPayload (+1 more)

### Community 32 - "Bank Report Route Context"
Cohesion: 0.22
Nodes (11): MonitoringIdRouteContext, MonitoringIdRouteContextType, SearchPersonnelSheetProps, ApiResponse, Input, PATH(), PathVariables, retrieve() (+3 more)

### Community 33 - "Bank Report Distribution Charts"
Cohesion: 0.35
Nodes (9): chartConfig, DarkModeToggle(), Card(), CardAction(), CardContent(), CardDescription(), CardFooter(), CardHeader() (+1 more)

### Community 34 - "Bank Report Notes And Types"
Cohesion: 0.17
Nodes (10): NOTE_OVERRIDES, NOTE: `json` is typed as step_1 rows only. A step_2 response actually, SaderatBankHealthMonitoring, SBHM_AnyRecord, SBHM_Retrieve_ByType, SBHM_Step1Record, SBHM_Type, SBHM_TYPES (+2 more)

### Community 35 - "Application Shell Layout"
Cohesion: 0.21
Nodes (7): geistMono, geistSans, LocaleLayout(), Props, vazirmatn, routing, config

### Community 36 - "Loading And Route Layouts"
Cohesion: 0.27
Nodes (6): Loading(), Layout(), ConsoleUnauthenticate(), generateMetadata(), getAuthRedirectUrl(), {Link, redirect, usePathname, useRouter, getPathname}

### Community 37 - "Monitoring Record Form"
Cohesion: 0.33
Nodes (9): initialValues(), RecordForm(), serverMessages(), uploadError(), formProblems(), create(), PatientEntryCreateInput, useCreate_PatientEntry_API() (+1 more)

### Community 38 - "Console Navigation Registry"
Cohesion: 0.29
Nodes (5): Client(), CONSOLE_NAV_ITEMS, ConsoleNavItem, useConsoleNavItems(), generateMetadata()

### Community 39 - "Runtime Dependencies"
Cohesion: 0.22
Nodes (9): class-variance-authority, clsx, @daypicker/react, dependencies, class-variance-authority, clsx, @daypicker/react, @tanstack/react-query (+1 more)

### Community 40 - "Patient Portal Plan"
Cohesion: 0.33
Nodes (9): Patient Portal Implementation Plan, Lean patient records provider, Patient Portal, Patient Portal Design, Patient records route, Patient session, Patient sign-in route, Patient UX gate (+1 more)

### Community 41 - "PowerShell Shared Helpers"
Cohesion: 0.36
Nodes (5): Get-CurrentBranch(), Get-FeatureDir(), Get-FeaturePathsEnv(), Get-RepoRoot(), Test-HasGit()

### Community 42 - "UI Breadcrumb Navigation"
Cohesion: 0.33
Nodes (4): Breadcrumb(), BreadcrumbItem(), BreadcrumbLink(), BreadcrumbList()

### Community 43 - "Bank Detail Sections"
Cohesion: 0.22
Nodes (8): Density, DENSITY_GRID, F, SectionField, STEP2_SECTIONS, STEP2_VITALS, Step2Section, VitalStat

### Community 44 - "Authentication Redirect Routes"
Cohesion: 0.31
Nodes (6): AUTH_FLOW_ROUTES, isAuthFlowRoute(), isProtectedRoute(), isPublicRoute(), PROTECTED_ROUTES, PUBLIC_ROUTES

### Community 45 - "Upload Presign API"
Cohesion: 0.32
Nodes (5): presign(), PresignInput, PresignResult, FileDescriptor, uploadToField()

### Community 46 - "Current User Query"
Cohesion: 0.36
Nodes (5): me(), ME_QUERY_KEY(), useMe_API(), USER_ME_KEY, User

### Community 47 - "Translation Message Checks"
Cohesion: 0.29
Nodes (4): en, fa, files, problems

### Community 48 - "Patient Portal Provider"
Cohesion: 0.33
Nodes (4): AuthProvider(), queryClient, Toaster(), jwt_verify()

### Community 49 - "Button Group Components"
Cohesion: 0.38
Nodes (5): ButtonGroup(), ButtonGroupSeparator(), ButtonGroupText(), buttonGroupVariants, Separator()

### Community 50 - "User Creation Mutation"
Cohesion: 0.29
Nodes (4): USER_CREATE_KEY, UserCreateApiError, UserCreateApiPayload, UserCreateApiResponse

### Community 51 - "Generated API Schema"
Cohesion: 0.33
Nodes (5): components, $defs, operations, paths, webhooks

### Community 52 - "Table Column Guidance"
Cohesion: 0.50
Nodes (5): DataTable Component, Sortable RTL data table, EHR table column hook, Generic table column hook, Table Columns Hooks

### Community 54 - "JWT Authentication API"
Cohesion: 0.50
Nodes (3): JWT_CREATE_KEY, JwtCreateApiError, JwtCreateApiPayload

### Community 56 - "Product Logo Asset"
Cohesion: 0.67
Nodes (3): Fazel Araghi Endowment Hospital, Sepehr Salamat, Sepehr Salamat logo for Fazel Araghi Endowment Hospital

## Knowledge Gaps
- **300 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+295 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **51 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Record Search And Filters` to `Electronic Record Views`, `Electronic Record Data Flow`, `Application Providers And State`, `Shared Sidebar Components`, `Monitoring Delete Flow`, `Monitoring Field Builder`, `Patient Monitoring Records`, `Console Page Layouts`, `Fonts And Global Layout`, `Schema Builder Drafts`, `Bank Report Detail Blocks`, `Account And Language Controls`, `Authentication State`, `Monitoring Type And Entry Actions`, `Report Chart Configuration`, `JWT Token Handling`, `Monitoring Record Form`, `Console Navigation Registry`, `Runtime Dependencies`, `Patient Portal Provider`?**
  _High betweenness centrality (0.185) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Runtime Dependencies` to `Record Search And Filters`, `Project Dependencies`, `Axios Dependency`, `Cn Dependency`, `Date Fns Dependency`, `Date Fns Jalali Dependency`, `Daypicker Persian Dependency`, `Embla Carousel React Dependency`, `Hookform Resolvers Dependency`, `Lucide React Dependency`, `Next Dependency`, `Next Intl Dependency`, `Next Themes Dependency`, `Persian Tools Persian Tools Dependency`, `Radix Ui Dependency`, `Radix Alert Dialog Dependency`, `Radix Ui React Collapsible Dependency`, `Radix Ui React Dialog Dependency`, `Radix Dropdown Menu Dependency`, `Radix Ui React Label Dependency`, `Radix Ui React Popover Dependency`, `Radix Ui React Select Dependency`, `Radix Ui React Separator Dependency`, `Radix Ui React Slot Dependency`, `Radix Ui React Tooltip Dependency`, `React Day Picker Dependency`, `React Dom Dependency`, `React Hook Form Dependency`, `Recharts Dependency`, `Sonner Dependency`, `Tailwind Merge Dependency`, `Tanstack React Table Dependency`, `Zod Dependency`?**
  _High betweenness centrality (0.131) - this node is a cross-community bridge._
- **Why does `cn()` connect `Shared Sidebar Components` to `Electronic Record Views`, `Bank Report Distribution Charts`, `Application Providers And State`, `Record Search And Filters`, `Monitoring Delete Flow`, `Monitoring Field Builder`, `Patient Monitoring Records`, `Fonts And Global Layout`, `Button Group Components`, `Bank Report Detail Blocks`, `Console Navigation Actions`, `Account And Language Controls`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _300 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Electronic Record Views` be split into smaller, more focused modules?**
  _Cohesion score 0.06796116504854369 - nodes in this community are weakly interconnected._
- **Should `Electronic Record Data Flow` be split into smaller, more focused modules?**
  _Cohesion score 0.05177993527508091 - nodes in this community are weakly interconnected._
- **Should `Application Providers And State` be split into smaller, more focused modules?**
  _Cohesion score 0.060526315789473685 - nodes in this community are weakly interconnected._
## Graph health
- 698 dangling extraction edges: 513 external references and 185 mostly absolute-path import IDs. Some relationships are absent from the final graph.
- 57 undirected same-endpoint edge collapses. Check source files for claims that depend on edge direction or repeated calls.

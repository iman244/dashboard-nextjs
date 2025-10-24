# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5+, React 19+, Next.js 15+  
**Primary Dependencies**: TanStack Query, React Hook Form, Zod, shadcn/ui, Radix UI, Axios, next-intl  
**Storage**: [External API integration - specify backend requirements]  
**Testing**: Jest, React Testing Library, Playwright (for E2E)  
**Target Platform**: Web (desktop, tablet, mobile responsive)  
**Project Type**: Next.js web application with App Router  
**Performance Goals**: Core Web Vitals "Good" scores, <3s initial load, <1s navigation  
**Constraints**: WCAG 2.1 AA compliance, 44px minimum touch targets, keyboard navigation  
**Scale/Scope**: [Specify user count, feature complexity, screen count]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Clean Code Standards Compliance
- [ ] Feature design follows single-purpose component principles
- [ ] TypeScript types are properly defined for all data structures
- [ ] Complex logic is identified for extraction into custom hooks/utilities
- [ ] Code organization follows page-specific structure with underscore prefixes

### Simple UX Guidelines Compliance
- [ ] User journey prioritizes clarity and ease of use
- [ ] Navigation flow is intuitive with clear visual hierarchy
- [ ] Form interactions provide immediate feedback
- [ ] Loading states and error handling are planned
- [ ] Feature scope avoids unnecessary complexity

### Responsive Design Requirements Compliance
- [ ] All interfaces designed for desktop, tablet, and mobile
- [ ] Tailwind CSS responsive utilities are planned
- [ ] Touch targets meet 44px minimum requirement
- [ ] Images/media optimization strategy defined

### Technology Stack Standards Compliance
- [ ] Uses Next.js 15+ with App Router
- [ ] State management uses TanStack Query for server state
- [ ] Forms use React Hook Form with Zod validation
- [ ] UI components use shadcn/ui with Radix UI primitives
- [ ] Internationalization uses next-intl
- [ ] Data fetching uses Axios with proper error handling
- [ ] Page-specific components use underscore prefix naming
- [ ] Data resources have type.ts and components/ folders
- [ ] Page context provided via provider.tsx imported in layout.tsx
- [ ] Server-side pages with optional client.tsx for client code
- [ ] Data fetching uses data.ts with unstable_cache

### Performance & Accessibility Compliance
- [ ] Core Web Vitals targets defined
- [ ] Code splitting strategy planned
- [ ] WCAG 2.1 AA compliance verified
- [ ] Keyboard navigation requirements defined

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (Next.js App Router Structure)

```text
src/
├── app/                          # Next.js App Router pages
│   ├── [locale]/                 # Internationalized routes
│   │   ├── (auth-flow)/          # Route groups for auth
│   │   ├── (authenticated)/      # Protected routes
│   │   └── (public)/             # Public routes
│   │       └── [page]/           # Page-specific structure
│   │           ├── page.tsx      # Server-side page
│   │           ├── client.tsx    # Client-side code (if needed)
│   │           ├── data.ts        # Page data fetching
│   │           ├── provider.tsx  # Page context provider
│   │           ├── layout.tsx    # Page layout (imports provider)
│   │           ├── _ehr-tab/      # Page-specific UI components
│   │           │   ├── tab.tsx
│   │           │   └── index.ts
│   │           └── _edit-sheet/   # Another page-specific component
│   │               ├── sheet.tsx
│   │               └── index.ts
│   ├── globals.css               # Global styles
│   ├── layout.tsx               # Root layout
│   └── provider.tsx             # Global providers
├── components/                   # Reusable components
│   └── ui/                      # shadcn/ui components
├── data/                        # Data layer
│   ├── [resource]/               # Resource-specific data logic
│   │   ├── type.ts              # Resource types
│   │   └── components/          # Resource-specific components
│   └── user/                    # User-related data
├── hooks/                       # Shared custom hooks
├── lib/                         # Utilities and configurations
│   ├── api/                     # API instances and configs
│   └── utils.ts                 # Shared utilities
├── i18n/                        # Internationalization
└── middleware.ts                # Next.js middleware
```

**Structure Decision**: Next.js App Router with page-specific component organization. Page-specific UI components use underscore prefix (`_ehr-tab/`, `_edit-sheet/`) and contain `index.ts` for clean exports. Data resources have `type.ts` and `components/` folders. Page context provided via `provider.tsx` imported in `layout.tsx`. Server-side pages with optional `client.tsx` for client code. Data fetching via `data.ts` with `unstable_cache`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |

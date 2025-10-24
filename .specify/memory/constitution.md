<!--
Sync Impact Report:
Version change: 1.0.0 → 1.1.0
Modified principles: Code Organization (expanded with specific structure requirements)
Added sections: N/A
Removed sections: Testing Requirements
Templates requiring updates: ✅ plan-template.md, ✅ spec-template.md, ✅ tasks-template.md
Follow-up TODOs: None
-->

# Djoser Next.js Constitution

## Core Principles

### I. Clean Code Standards (NON-NEGOTIABLE)

All code MUST follow established patterns and maintainability standards. Components MUST be single-purpose, well-named, and properly typed. Use TypeScript strict mode, ESLint rules, and Prettier formatting. Functions MUST be pure when possible, with clear input/output contracts. Complex logic MUST be extracted into custom hooks or utility functions. Code reviews MUST verify readability, testability, and adherence to established patterns.

### II. Simple UX Guidelines

User interfaces MUST prioritize clarity and ease of use. Navigation MUST be intuitive with clear visual hierarchy. Forms MUST provide immediate feedback and validation. Loading states MUST be communicated clearly. Error messages MUST be actionable and user-friendly. Follow progressive disclosure principles - show only what users need when they need it. Avoid feature bloat and maintain focus on core user journeys.

### III. Responsive Design Requirements

All interfaces MUST work seamlessly across desktop, tablet, and mobile devices. Use Tailwind CSS responsive utilities consistently. Components MUST adapt gracefully to different screen sizes. Touch targets MUST meet accessibility standards (minimum 44px). Images and media MUST be optimized for different viewports. Test on actual devices, not just browser dev tools.

### IV. Technology Stack Standards

MUST use Next.js 15+ with App Router, React 19+, TypeScript, and Tailwind CSS. State management MUST use TanStack Query for server state and React hooks for local state. Forms MUST use React Hook Form with Zod validation. UI components MUST use shadcn/ui with Radix UI primitives. Internationalization MUST use next-intl. Data fetching MUST use Axios with proper error handling and loading states.

### V. Performance & Accessibility

Applications MUST achieve Core Web Vitals scores in the "Good" range. Images MUST be optimized using Next.js Image component. Code splitting MUST be implemented at route and component levels. Accessibility MUST meet WCAG 2.1 AA standards. All interactive elements MUST be keyboard navigable. Color contrast MUST meet accessibility requirements.

## Development Standards

### Code Organization

- Components MUST be organized by feature, not by type
- Shared UI components MUST be in `/src/components/ui/`
- Page-specific UI components MUST be co-located with pages using underscore prefix (`_ehr-tab/`, `_projects-tab/`, `_edit-record-sheet/`)
- Each UI component folder MUST contain `index.ts` for clean exports
- Data resources MUST be in `/src/data/[resource]/` with `type.ts` and `components/` folders
- Resource-specific components MUST live in `/src/data/[resource]/components/`
- Page context MUST be provided via `provider.tsx` next to `page.tsx` and imported in `layout.tsx`
- Provider files MUST contain their own hooks for context usage
- Pages MUST be server-side (`page.tsx`) with `client.tsx` for client-side code
- Page data fetching MUST use `data.ts` with async `get_data()` function
- Resource fetching MUST use separate `get_[resource_name]_data()` functions with `unstable_cache`

### Quality Gates

- All code MUST pass ESLint and TypeScript compilation
- Performance budgets MUST be enforced
- Accessibility audits MUST pass automated checks

## Governance

This constitution supersedes all other development practices and MUST be followed by all team members. Amendments require team consensus and MUST be documented with rationale. All pull requests MUST verify compliance with these principles. Complexity additions MUST be justified with clear business value. Use this constitution as the primary reference for all development decisions.

**Version**: 1.1.0 | **Ratified**: 2025-01-27 | **Last Amended**: 2025-01-27

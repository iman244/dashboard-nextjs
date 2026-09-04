This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Patient portal

Two routes outside the console, at `/{locale}/patient/sign-in` and
`/{locale}/patient/records`. A patient signs in with their national ID as both
username and password; the sign-in probes `/EHRByNationalNumber` over a ten-year
window and admits them if anything comes back. The records page then shows that
one national ID's rows, filterable by date range and record type only — the ID
comes from the session and is never filter state, so the UI offers no way to
reach another patient's records.

**This is a UX gate, not a security boundary.** The upstream EHR API takes no
credentials — see `src/lib/api/5.160.115.210/5apiInstance.ts`, which has no
request interceptor, unlike the Django instance. Anyone can query any national
ID against it directly, regardless of this UI. Concretely, and by design:

- The password check (`password === national ID`) is not authentication.
- The route guards are client-side only; nothing is enforced on a server.
- The national ID is held in `sessionStorage`, and here it doubles as the
  credential.
The sign-in page itself gives nothing away: a wrong password and an unknown
national ID produce the same generic rejection, and a failed request produces a
separate service-error message so a dead upstream is not blamed on the person
typing. That keeps the page from confirming which IDs exist — though the open
upstream still answers that question directly to anyone who asks it.

Do not treat these pages as protecting patient data. Making them do so means
moving the records call behind Django with a real per-patient credential.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

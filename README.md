# Greeks of the Riverland

Community heritage website for the Greek families of South Australia's Riverland (1950 – 2020).

Built with Next.js (App Router) and Font Awesome, deployed on Vercel.

## Edit content
- Families, towns and story topics: `data/site.ts`
  - Add a family: copy the Savaidis entry in `FAMILIES`, change the fields, commit. A page is created at `/families/<slug>` automatically.
- Google Form link: `FORM_URL` in `data/site.ts`

## Run locally
```
npm install
npm run dev
```

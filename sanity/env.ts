/* sanity/env.ts
   Central place for pulling the three Sanity env-vars.
   Works for both the Next.js app (NEXT_PUBLIC_…)
   and the embedded/stand-alone Studio (SANITY_STUDIO_…). */

   export const apiVersion =
   process.env.SANITY_STUDIO_API_VERSION ||
   process.env.NEXT_PUBLIC_SANITY_API_VERSION ||
   '2025-04-26'                              // fallback – keep in sync with Sanity
 
 export const dataset = assertValue(
   process.env.SANITY_STUDIO_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET,
   'Missing environment variable: SANITY_STUDIO_DATASET'
 )
 
 export const projectId = assertValue(
   process.env.SANITY_STUDIO_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
   'Missing environment variable: SANITY_STUDIO_PROJECT_ID'
 )
 
 /* ─ helpers ─ */
 function assertValue<T>(v: T | undefined, errorMessage: string): T {
   if (v === undefined) throw new Error(errorMessage)
   return v
 }
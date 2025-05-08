/* sanity/schemaTypes/index.ts
   – central export for all document types
   ------------------------------------------------------------------ */

   import cardTemplate  from './cardTemplate'
   import cardProduct   from './cardProduct'
   import aiPlaceholder from './aiPlaceholder'
   
   /* facet look-ups (new) */
   import occasion from './occasion'
   import audience from './audience'
   import theme    from './theme'
   import relation from './relation'
   
   /* ---------- shim for older Studio versions ---------- */
   import {defineField as _df} from 'sanity'
   export const defineFieldset = (x: any) => x as ReturnType<typeof _df>
   /* ---------------------------------------------------- */
   
   /* one flat array that Studio expects */
   export const schemaTypes = [
     cardTemplate,
     cardProduct,
     aiPlaceholder,
   
     /* facets */
     occasion,
     audience,
     theme,
     relation,
   ]
   
   export default schemaTypes
/* sanity/schemaTypes/index.ts
   – central export for all document / object types
   -------------------------------------------------------------- */

   import cardTemplate  from './cardTemplate'
   import cardProduct   from './cardProduct'
   
   /* AI-related ---------------------------------------------------- */
   import aiPlaceholder from './aiPlaceholder'
   import aiLayer       from './aiLayer'
   
   /* core editable objects ---------------------------------------- */
   import editableImage from './editableImage'
   import editableText  from './editableText'
   
   /* facet look-ups ----------------------------------------------- */
   import occasion from './occasion'   // ← RE-ADDED ✔
   import audience from './audience'   // ← RE-ADDED ✔
   import theme    from './theme'      // ← RE-ADDED ✔
   import relation from './relation'   // ← RE-ADDED ✔
   
   /* one flat array that Studio expects --------------------------- */
   export const schemaTypes = [
     /* documents */
     cardTemplate,
     cardProduct,
     aiPlaceholder,
   
     /* objects */
     aiLayer,
     editableImage,
     editableText,
   
     /* facets */
     occasion,
     audience,
     theme,
     relation,
   ]
   
   export default schemaTypes
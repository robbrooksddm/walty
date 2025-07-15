/* sanity/schemaTypes/index.ts
   – central export for all document / object types
   -------------------------------------------------------------- */

import cardTemplate  from './cardTemplate'
import cardProduct   from './cardProduct'
import product       from './product'
import productMockup from './productMockup'
import sitePage      from './sitePage'
import visualVariant from './visualVariant'

/* commerce ---------------------------------------------- */
import fulfilOption from './commerce/fulfilOption'
import skuMap      from './commerce/skuMap'

/* AI-related ---------------------------------------------------- */
import aiPlaceholder from './aiPlaceholder'
import aiLayer       from './aiLayer'

/* core editable objects ---------------------------------------- */
import editableImage from './editableImage'
import editableText  from './editableText'
import heroSection   from './heroSection'
import printSpec     from './printSpec'
import mockupSettings from './objects/mockupSettings'
import printArea      from './objects/printArea'
import cameraPose     from './objects/cameraPose'
import colourVariant  from './objects/colourVariant'

/* facet look-ups ----------------------------------------------- */
import occasion from './occasion'   // ← RE-ADDED ✔
import audience from './audience'   // ← RE-ADDED ✔
import theme    from './theme'      // ← RE-ADDED ✔
import relation from './relation'   // ← RE-ADDED ✔

/* one flat array that Studio expects --------------------------- */
export const schemaTypes = [
  /* documents */
  cardTemplate,
  product,
  cardProduct,
  productMockup,
  sitePage,
  fulfilOption,
  skuMap,
  visualVariant,
  aiPlaceholder,
  printSpec,

  /* objects */
  aiLayer,
  editableImage,
  editableText,
  heroSection,
  mockupSettings,
  printArea,
  cameraPose,
  colourVariant,

  /* facets */
  occasion,
  audience,
  theme,
  relation,
]

export default schemaTypes

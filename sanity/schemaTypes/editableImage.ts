/**********************************************************************
 * editableImage.ts – customer-editable image layer
 *********************************************************************/
import { defineType, defineField } from 'sanity'

export default defineType({
  name : 'editableImage',
  type : 'object',
  title: 'Editable image',

  fields: [
    /* normal author-visible settings ----------------------------- */
    defineField({ name: 'src',  type: 'image',  title: 'Default image', options:{ hotspot:true } }),
    defineField({ name: 'x',    type: 'number', title: 'X (px)' }),
    defineField({ name: 'y',    type: 'number', title: 'Y (px)' }),
    defineField({ name: 'w',    type: 'number', title: 'Width  (px)' }),
    defineField({ name: 'h',    type: 'number', title: 'Height (px)' }),

    /* hidden, editor-only metadata ------------------------------- */
    defineField({ name: 'width',   type: 'number', hidden: true }),   // Fabric calc
    defineField({ name: 'height',  type: 'number', hidden: true }),
    defineField({ name: 'scaleX',  type: 'number', hidden: true }),
    defineField({ name: 'scaleY',  type: 'number', hidden: true }),
    defineField({ name: 'opacity', type: 'number', hidden: true }),
    defineField({ name: 'srcUrl',  type: 'url',    hidden: true }),   // raw URL fallback
  ],
})
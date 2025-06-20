import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'product',
  type: 'document',
  title: 'Product',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Product name',
      validation: r => r.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      title: 'Slug',
      options: { source: 'title', maxLength: 96 },
      validation: r => r.required(),
    }),
  defineField({
    name: 'description',
    type: 'text',
    title: 'Description',
  }),

  defineField({
    name: 'previewSpec',
    type: 'object',
    title: 'Preview canvas',
    fields: [
      {
        name: 'previewWidthPx',
        type: 'number',
        title: 'Width (px)',
        initialValue: 420,
        validation: r => r.required().positive(),
      },
      {
        name: 'previewHeightPx',
        type: 'number',
        title: 'Height (px)',
        initialValue: 580,
        validation: r => r.required().positive(),
      },
      defineField({
        name: 'maxMobileWidthPx',
        type: 'number',
        title: 'Max mobile width (px)',
      }),
      defineField({
        name: 'safeInsetXPx',
        type: 'number',
        title: 'Safe inset X (px)',
        initialValue: 0,
      }),
      defineField({
        name: 'safeInsetYPx',
        type: 'number',
        title: 'Safe inset Y (px)',
        initialValue: 0,
      }),
    ],
  }),

  defineField({
    name: 'pageCount',
    type: 'number',
    title: 'Pages',
    initialValue: 4,
    validation: r => r.required().integer().min(1).max(4),
  }),

  defineField({
    name: 'showSafeArea',
    type: 'boolean',
    title: 'Show safe-area overlay',
    initialValue: true,
    description: 'Display the safe-area guide when editing templates',
    options: { layout: 'switch' },
    validation: r => r.required(),
  }),
  defineField({
    name: 'variants',
    type: 'array',
    title: 'Variants',
    of: [{ type: 'reference', to: [{ type: 'cardProduct' }] }],
    validation: r => r.min(1),
  }),
  ],
})

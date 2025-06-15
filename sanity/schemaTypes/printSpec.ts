import {defineType, defineField, defineArrayMember} from 'sanity'

export default defineType({
  name: 'printSpec',
  type: 'document',
  title: 'Print specification',
  fields: [
    defineField({
      name: 'trimWidthIn',
      type: 'number',
      title: 'Trim width (inches)',
      validation: r => r.required().positive(),
    }),
    defineField({
      name: 'trimHeightIn',
      type: 'number',
      title: 'Trim height (inches)',
      validation: r => r.required().positive(),
    }),
    defineField({
      name: 'bleedIn',
      type: 'number',
      title: 'Bleed (inches)',
      initialValue: 0.125,
      validation: r => r.required().min(0),
    }),
    defineField({
      name: 'dpi',
      type: 'number',
      title: 'DPI',
      initialValue: 300,
      validation: r => r.required().min(72),
    }),
    defineField({
      name: 'spreadLayout',
      type: 'object',
      title: 'Spread layout',
      fields: [
        defineField({
          name: 'spreadWidth',
          type: 'number',
          title: 'Artboard width (inches)',
          validation: r => r.required().positive(),
        }),
        defineField({
          name: 'spreadHeight',
          type: 'number',
          title: 'Artboard height (inches)',
          validation: r => r.required().positive(),
        }),
        defineField({
          name: 'panels',
          type: 'array',
          title: 'Panels (placement order)',
          of: [
            defineArrayMember({
              type: 'object',
              fields: [
                defineField({ name: 'name',  type: 'string', title: 'Page name' }),
                defineField({ name: 'order', type: 'number', title: 'Order' }),
                defineField({
                  name: 'bleed',
                  type: 'object',
                  title: 'Bleed edges',
                  options: { columns: 4 },
                  fields: [
                    defineField({ name: 'top',    type: 'boolean', title: 'Top',    initialValue: true }),
                    defineField({ name: 'right',  type: 'boolean', title: 'Right',  initialValue: true }),
                    defineField({ name: 'bottom', type: 'boolean', title: 'Bottom', initialValue: true }),
                    defineField({ name: 'left',   type: 'boolean', title: 'Left',   initialValue: true }),
                  ],
                }),
              ],
            }),
          ],
          validation: r => r.length(4),
        }),
      ],
    }),
  ],
  preview: {
    select: {
      w: 'trimWidthIn',
      h: 'trimHeightIn',
      d: 'dpi',
    },
    prepare({w, h, d}) {
      return {
        title: `${w} × ${h} in @ ${d} dpi`,
      }
    },
  },
})

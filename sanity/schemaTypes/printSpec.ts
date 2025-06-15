import {defineType, defineField} from 'sanity'

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
      name: 'edgeBleed',
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
          name: 'foldX',
          type: 'number',
          title: 'Fold position X (inches)',
          validation: r => r.required().min(0),
        }),
        defineField({
          name: 'panelOrder',
          type: 'array',
          title: 'Panel order (left → right)',
          of: [{ type: 'string' }],
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

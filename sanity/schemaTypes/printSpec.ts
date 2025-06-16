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
          initialValue: [
            { name: 'Outer rear',  page: 'back',    order: 0, bleed: { top: true, right: true, bottom: true, left: true } },
            { name: 'Outer front', page: 'front',   order: 1, bleed: { top: true, right: true, bottom: true, left: true } },
            { name: 'Inside front', page: 'inner-R', order: 2, bleed: { top: true, right: true, bottom: true, left: true } },
            { name: 'Inside back', page: 'inner-L',  order: 3, bleed: { top: true, right: true, bottom: true, left: true } },
          ],
          of: [
            defineArrayMember({
              type: 'object',
              fields: [
                defineField({ name: 'name',  type: 'string', title: 'Panel name' }),
                defineField({
                  name: 'page',
                  type: 'string',
                  title: 'Card page',
                  options: {
                    list: [
                      { title: 'Front cover', value: 'front' },
                      { title: 'Inner left',  value: 'inner-L' },
                      { title: 'Inner right', value: 'inner-R' },
                      { title: 'Back cover',  value: 'back' },
                    ],
                    layout: 'dropdown',
                  },
                  validation: r => r.required(),
                }),
                defineField({
                  name: 'order',
                  type: 'number',
                  title: 'Order',
                  validation: r => r.required().min(0),
                }),
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
          validation: r =>
            r.custom(panels => {
              if (!Array.isArray(panels)) return 'Missing panels'
              const orders = panels.map(p => p.order)
              if (orders.some(o => typeof o !== 'number')) {
                return 'Each panel must define an order'
              }
              if (orders.length !== new Set(orders).size) {
                return 'Panel orders must be unique'
              }
              return true
            }),
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

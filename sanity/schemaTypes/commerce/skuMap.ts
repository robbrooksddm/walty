import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'skuMap',
  type: 'document',
  title: 'SKU mapping',
  fields: [
    defineField({
      name: 'variant',
      type: 'reference',
      title: 'Variant',
      to: [{type: 'variant'}],
      validation: r => r.required(),
    }),
    defineField({
      name: 'fulfil',
      type: 'reference',
      title: 'Fulfilment',
      to: [{type: 'fulfil'}],
      validation: r => r.required(),
    }),
    defineField({ name: 'prodigiSku',    type: 'string', title: 'Prodigi SKU',    validation: r => r.required() }),
    defineField({ name: 'printAreaId',   type: 'string', title: 'Print area ID',  validation: r => r.required() }),
    defineField({ name: 'sizingStrategy',type: 'string', title: 'Sizing',         validation: r => r.required() }),
  ],
})

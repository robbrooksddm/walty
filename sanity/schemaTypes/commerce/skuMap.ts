import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'skuMap',
  type: 'document',
  title: 'SKU mapping',
  fields: [
    defineField({
      name: '_id',
      type: 'string',
      title: 'Document ID',
      description: 'ID should combine variant and fulfil IDs',
      validation: r => r.required(),
    }),
    defineField({
      name: 'variant',
      type: 'reference',
      title: 'Variant',
      to: [{type: 'cardProduct'}],
      validation: r => r.required(),
    }),
    defineField({
      name: 'fulfil',
      type: 'reference',
      title: 'Fulfilment',
      to: [{type: 'fulfilOption'}],
      validation: r => r.required(),
    }),
    defineField({ name: 'prodigiSku',    type: 'string', title: 'Prodigi SKU',    validation: r => r.required() }),
    defineField({ name: 'printAreaId',   type: 'string', title: 'Print area ID',  validation: r => r.required() }),
    defineField({ name: 'sizingStrategy',type: 'string', title: 'Sizing',         validation: r => r.required() }),
  ],
})

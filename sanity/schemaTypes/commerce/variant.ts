import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'variant',
  type: 'document',
  title: 'Variant',
  fields: [
    defineField({ name: 'title', type: 'string', title: 'Title', validation: r => r.required() }),
    defineField({
      name: 'productType',
      type: 'reference',
      title: 'Product type',
      to: [{type: 'productType'}],
      validation: r => r.required(),
    }),
    defineField({
      name: 'printSpec',
      type: 'reference',
      title: 'Print specification',
      to: [{type: 'printSpec'}],
      validation: r => r.required(),
    }),
  ],
})

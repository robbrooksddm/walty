import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'productType',
  type: 'document',
  title: 'Product type',
  fields: [
    defineField({ name: 'title', type: 'string', title: 'Title', validation: r => r.required() }),
    defineField({ name: 'slug',  type: 'slug',   title: 'Slug',  options: {source: 'title', maxLength: 96}, validation: r => r.required() }),
  ],
})

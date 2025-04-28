// sanity/schemaTypes/cardTemplate.ts
import {defineType, defineField} from 'sanity'

export default defineType({
  name:  'cardTemplate',
  title: 'Card template',
  type:  'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Template name',
      type: 'string',
      validation: Rule => Rule.required(),
    }),

    /* 👇 NEW FIELD 👇 */
    defineField({
      name:   'slug',
      title:  'Slug',
      type:   'slug',
      options: {
        source: 'title',   // auto-generate from title
        maxLength: 96,
      },
      validation: Rule => Rule.required(),
    }),

    defineField({
      name:  'json',
      title: 'Template JSON',
      type:  'text',
      rows:  10,
    }),
  ],
})
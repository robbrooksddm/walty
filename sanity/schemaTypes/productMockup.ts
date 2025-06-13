import {defineType, defineField, defineArrayMember} from 'sanity'

export default defineType({
  name: 'productMockup',
  type: 'document',
  title: 'Product mockup',
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
      name: 'areas',
      type: 'array',
      title: 'Printable areas',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'area',
          fields: [
            defineField({ name: 'name', type: 'string', validation: r => r.required() }),
            defineField({ name: 'image', type: 'image', title: 'Preview image', validation: r => r.required() }),
          ],
        })
      ],
      validation: r => r.min(1),
    }),
  ],
})

import {defineType, defineField, defineArrayMember} from 'sanity'

export default defineType({
  name: 'colourVariant',
  type: 'object',
  title: 'Colour variant',
  fields: [
    defineField({ name: 'name', type: 'string', title: 'Colour name', validation: r => r.required() }),
    defineField({ name: 'tint', type: 'string', title: 'Tint HEX', validation: r => r.required() }),
    defineField({
      name: 'meshes',
      type: 'array',
      title: 'Mesh names',
      of: [defineArrayMember({ type: 'string' })],
    }),
  ],
})

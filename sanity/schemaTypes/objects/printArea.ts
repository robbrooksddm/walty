import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'printArea',
  type: 'object',
  title: 'Print area',
  fields: [
    defineField({ name: 'id', type: 'string', title: 'Area ID', validation: r => r.required() }),
    defineField({ name: 'mesh', type: 'string', title: 'Mesh name', validation: r => r.required() }),
  ],
})

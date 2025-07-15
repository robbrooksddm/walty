import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'mockupSettings',
  type: 'object',
  title: 'Mockup settings',
  fields: [
    defineField({
      name: 'model',
      type: 'file',
      title: 'GLB model',
      validation: r => r.required(),
    }),
    defineField({
      name: 'hdr',
      type: 'file',
      title: 'HDR environment',
    }),
    defineField({
      name: 'printAreas',
      type: 'array',
      title: 'Printable areas',
      of: [{type: 'printArea'}],
    }),
    defineField({
      name: 'cameras',
      type: 'array',
      title: 'Camera poses',
      of: [{type: 'cameraPose'}],
    }),
  ],
})

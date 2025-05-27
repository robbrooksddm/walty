import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'heroSection',
  type: 'object',
  title: 'Hero section',
  fields: [
    defineField({name: 'heading', type: 'string'}),
    defineField({name: 'subheading', type: 'string'}),
    defineField({name: 'image', type: 'image', options: {hotspot: true}}),
  ],
})

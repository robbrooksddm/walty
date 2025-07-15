import {defineType, defineField, defineArrayMember} from 'sanity'

export default defineType({
  name: 'visualVariant',
  type: 'document',
  title: 'Visual variant',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      validation: r => r.required(),
    }),
    defineField({
      name: 'variant',
      type: 'reference',
      title: 'Variant',
      to: [{ type: 'cardProduct' }],
      validation: r => r.required(),
    }),
    defineField({
      name: 'mockupSettings',
      type: 'mockupSettings',
      title: 'Mockup settings',
      validation: r => r.required(),
    }),
    defineField({
      name: 'colourVariants',
      type: 'array',
      title: 'Colour variants',
      of: [{ type: 'colourVariant' }],
    }),
    defineField({
      name: 'previewImages',
      type: 'array',
      title: 'Preview images',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({ name: 'colour', type: 'string', title: 'Colour key' }),
            defineField({ name: 'camera', type: 'string', title: 'Camera' }),
            defineField({ name: 'url', type: 'url', title: 'PNG URL' }),
          ],
        }),
      ],
    }),
  ],
})

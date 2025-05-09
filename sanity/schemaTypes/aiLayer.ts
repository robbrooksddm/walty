/**********************************************************************
 * aiLayer.ts – AI face-swap placeholder layer
 *********************************************************************/
import { defineType, defineField } from 'sanity'
import { ComposeIcon } from '@sanity/icons'

export default defineType({
  name : 'aiLayer',
  type : 'object',
  title: 'AI face-swap layer',
  icon : ComposeIcon,

  fields: [
    defineField({
      name : 'source',
      type : 'reference',
      to   : [{ type: 'aiPlaceholder' }],
      title: 'Placeholder spec',
      validation: r => r.required(),
    }),

    /* geometry coming from the editor – hidden in Studio UI */
    defineField({ name: 'x',       type: 'number', hidden: true }),
    defineField({ name: 'y',       type: 'number', hidden: true }),
    defineField({ name: 'w',       type: 'number', hidden: true }),
    defineField({ name: 'h',       type: 'number', hidden: true }),
    defineField({ name: 'width',   type: 'number', hidden: true }),
    defineField({ name: 'height',  type: 'number', hidden: true }),
    defineField({ name: 'scaleX',  type: 'number', hidden: true }),
    defineField({ name: 'scaleY',  type: 'number', hidden: true }),
    defineField({ name: 'opacity', type: 'number', hidden: true }),
    defineField({ name: 'src',     type: 'url',    hidden: true }),  // PNG URL after swap

    defineField({
      name : 'locked',
      type : 'boolean',
      title: 'Lock position & size?',
      initialValue: false,
    }),
  ],

  preview: {
    /* pull title, prompt *and* the thumbnail from the referenced doc */
    select: {
      title   : 'source.title',        // short label
      prompt  : 'source.prompt',       // full prompt (optional subtitle)
      media   : 'source.refImage',
    },
    prepare({ title, prompt, media }) {
      return {
        title    : title ?? 'AI placeholder',     // use short title when present
        subtitle : !title && prompt               // show truncated prompt only if no title
                     ? `${prompt.slice(0, 40)}…`
                     : undefined,
        media,
      }
    },
  },
})
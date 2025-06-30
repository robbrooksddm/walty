/**********************************************************************
 * cardProduct (SKU)
 * One document per BUYABLE variant (size, pages, price …)
 *********************************************************************/
import {defineType, defineField} from 'sanity'

export default defineType({
  name : 'cardProduct',
  type : 'document',
  title: 'Card product',

  fields: [
    /* visible name shown to staff & in checkout */
    defineField({
      name : 'title',
      type : 'string',
      title: 'Product name',
      validation: (Rule) => Rule.required(),
    }),

    /* slug used in URLs (/<product-slug>/...) */
    defineField({
      name : 'slug',
      type : 'slug',
      title: 'Slug',
      options: {source: 'title', maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name : 'variantHandle',
      type : 'string',
      title: 'Variant handle',
      description: 'Short stable key like "gc-mini"',
      validation: r => r.required(),
    }),

    defineField({
      name : 'blurb',
      type : 'string',
      title: 'Blurb',
      description: 'Short description shown on the product page',
    }),


    /* which mockup images define the preview */
    defineField({
      name : 'mockup',
      type : 'reference',
      title: 'Preview mockup',
      to   : [{type: 'productMockup'}],
    }),

    /* commercial bits */
    defineField({
      name : 'price',
      type : 'number',
      title: 'Retail price (£)',
      validation: (Rule) => Rule.required().positive(),
    }),

    /* how the product should be printed */
    defineField({
      name: 'printSpec',
      title: 'Print specification',
      type: 'reference',
      to: [{ type: 'printSpec' }],
      validation: Rule => Rule.required(),
    }),

  ],

})

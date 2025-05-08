import {defineType, defineField} from 'sanity'

export default defineType({
  name :'occasion',
  type :'document',
  title:'Occasion',
  fields:[
    defineField({
      name:'title',
      type:'string',
      title:'Occasion',
      validation:r=>r.required(),
    }),
    defineField({
      name:'slug',
      type:'slug',
      title:'Slug',
      options:{source:'title', maxLength:96},
      validation:r=>r.required(),
    }),
  ],
})
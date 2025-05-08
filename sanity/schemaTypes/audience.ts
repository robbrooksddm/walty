import {defineType, defineField} from 'sanity'

export default defineType({
  name :'audience',
  type :'document',
  title:'Audience',
  fields:[
    defineField({name:'title', type:'string', title:'Audience', validation:r=>r.required()}),
    defineField({name:'slug',  type:'slug',   title:'Slug',     options:{source:'title',maxLength:96}, validation:r=>r.required()}),
  ],
})
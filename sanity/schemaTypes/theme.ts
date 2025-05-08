import {defineType, defineField} from 'sanity'

export default defineType({
  name :'theme',
  type :'document',
  title:'Theme',
  fields:[
    defineField({name:'title', type:'string', title:'Theme', validation:r=>r.required()}),
    defineField({name:'slug',  type:'slug',   title:'Slug',  options:{source:'title',maxLength:96}, validation:r=>r.required()}),
  ],
})
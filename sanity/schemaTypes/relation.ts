import {defineType, defineField} from 'sanity'

export default defineType({
  name :'relation',
  type :'document',
  title:'Relation',
  fields:[
    defineField({name:'title', type:'string', title:'Relation', validation:r=>r.required()}),
    defineField({name:'slug',  type:'slug',   title:'Slug', options:{source:'title',maxLength:96}, validation:r=>r.required()}),
  ],
})
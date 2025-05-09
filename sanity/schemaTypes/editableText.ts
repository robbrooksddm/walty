/* editableText.ts – inline, customer-editable copy block  */
import {defineType, defineField} from 'sanity'

export default defineType({
  name :'editableText',
  type :'object',
  title:'Editable text',
  fields:[
    /* geometry */
    defineField({name:'x', type:'number', hidden:true}),
    defineField({name:'y', type:'number', hidden:true}),
    defineField({name:'width', type:'number', hidden:true}),
    /* content + style */
    defineField({name:'text',       type:'string', title:'Default text'}),
    defineField({name:'fontSize',   type:'number'}),
    defineField({name:'fontFamily', type:'string'}),
    defineField({name:'fontWeight', type:'string'}),
    defineField({name:'fontStyle',  type:'string'}),
    defineField({name:'underline',  type:'boolean'}),
    defineField({name:'fill',       type:'string'}),
    defineField({name:'textAlign',  type:'string'}),
    defineField({name:'lineHeight', type:'number'}),
  ],
})
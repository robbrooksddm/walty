import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'cameraPose',
  type: 'object',
  title: 'Camera pose',
  fields: [
    defineField({ name: 'name', type: 'string', validation: r => r.required() }),
    defineField({ name: 'posX', type: 'number', title: 'Pos X', validation: r => r.required() }),
    defineField({ name: 'posY', type: 'number', title: 'Pos Y', validation: r => r.required() }),
    defineField({ name: 'posZ', type: 'number', title: 'Pos Z', validation: r => r.required() }),
    defineField({ name: 'targetX', type: 'number', title: 'Target X' }),
    defineField({ name: 'targetY', type: 'number', title: 'Target Y' }),
    defineField({ name: 'targetZ', type: 'number', title: 'Target Z' }),
    // rotational offsets to fine-tune the view
    defineField({
      name: 'rotationX',
      type: 'number',
      title: 'Rotation X',
    }),
    defineField({
      name: 'rotationY',
      type: 'number',
      title: 'Rotation Y',
    }),
    defineField({
      name: 'rotationZ',
      type: 'number',
      title: 'Rotation Z',
    }),
    defineField({ name: 'fov', type: 'number', title: 'FOV' }),
  ],
})

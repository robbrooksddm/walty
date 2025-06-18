import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'fulfilOption',
  type: 'document',
  title: 'Fulfilment option',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title',
      validation: r => r.required(),
    }),
    defineField({
      name: 'shipTo',
      type: 'string',
      title: 'Ship to',
      options: {
        list: [
          {title: 'Buyer',      value: 'buyer'},
          {title: 'Recipient',  value: 'recipient'},
          {title: 'Warehouse',  value: 'warehouse'},
        ],
        layout: 'radio',
      },
      validation: r => r.required(),
    }),
    defineField({
      name: 'packaging',
      type: 'string',
      title: 'Packaging',
      options: {
        list: [
          {title: 'Flat', value: 'flat'},
          {title: 'Tube', value: 'tube'},
          {title: 'Box',  value: 'box'},
        ],
        layout: 'radio',
      },
      validation: r => r.required(),
    }),
    defineField({ name: 'shippingMethod', type: 'string', title: 'Shipping method', validation: r => r.required() }),
    defineField({ name: 'serviceLevel',   type: 'string', title: 'Service level',   validation: r => r.required() }),
    defineField({ name: 'postageCostExVat', type: 'number', title: 'Postage cost ex-VAT', validation: r => r.required() }),
    defineField({ name: 'surchargeIncVat', type: 'number', title: 'Surcharge inc VAT' }),
    defineField({ name: 'isTracked',       type: 'boolean', title: 'Tracked service' }),
    defineField({ name: 'guaranteeBy',     type: 'string',  title: 'Guarantee by' }),
    defineField({ name: 'guaranteeCutoffUtc', type: 'datetime', title: 'Guarantee cutoff UTC' }),
    defineField({ name: 'refundPolicy',    type: 'text',    title: 'Refund policy' }),
    defineField({ name: 'region',          type: 'string',  title: 'Region' }),
    defineField({ name: 'leadTimeDays',    type: 'number',  title: 'Lead time (days)' }),
    defineField({ name: 'maxCardsPerPackage', type: 'number', title: 'Max cards per package' }),
    defineField({ name: 'active',          type: 'boolean', title: 'Active', initialValue: true, validation: r => r.required() }),
  ],
})

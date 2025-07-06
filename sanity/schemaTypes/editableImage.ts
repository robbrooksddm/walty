/**********************************************************************
 * editableImage.ts – inline, customer-editable image layer
 *********************************************************************/
import {defineType, defineField} from 'sanity'
import {ImageIcon}               from '@sanity/icons'
import React                     from 'react'

export default defineType({
  name : 'editableImage',
  type : 'object',
  title: 'Editable image',
  icon : ImageIcon,

  /* ── geometry + style (hidden) ── */
  fields: [
    ...(['x','y','w','h','width','height','scaleX','scaleY','opacity','angle'] as const)
      .map((n) => defineField({name: n, type: 'number', hidden: true})),

    /* uploaded Sanity asset */
    defineField({
      name : 'src',
      type : 'image',
      title: 'Image asset',
      options: {hotspot: true},
    }),

    /* raw URL / blob while the upload is still in progress */
    defineField({name: 'srcUrl', type: 'url', hidden: true}),
  ],

  /* ── layer-list preview ── */
  preview: {
    select: {
      imgAsset: 'src.asset', // asset ref (if present)
      url     : 'srcUrl',    // raw URL fallback
    },
    prepare({imgAsset, url}: {imgAsset?: unknown; url?: string}) {
      /* build a React node that React can mount */
      const media =
        imgAsset
          ? (imgAsset as unknown as React.ReactNode)
          : url
              ? React.createElement('img', {
                  src  : url,
                  style: {
                    objectFit   : 'cover',
                    width       : '100%',
                    height      : '100%',
                    borderRadius: 4,
                  },
                })
              : ImageIcon

      /* ✅ we **return** the preview object */
      return {
        title   : 'Image',
        subtitle: imgAsset ? undefined : 'external image',
        media,
      }
    },
  },
})
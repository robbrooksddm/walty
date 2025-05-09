import React from 'react'
import {Card, Stack, Text} from '@sanity/ui'
import {ObjectInputProps} from 'sanity'
import {urlFor} from '../lib/image'

export default function ExternalImagePreview(
  props: ObjectInputProps & {value?: any},
) {
  const {value} = props                      // {asset?, srcUrl?}
  const assetRef = value?.asset?._ref
  const srcUrl   = value?.srcUrl

  const previewUrl = assetRef
    ? urlFor({_type: 'image', asset: {_ref: assetRef}})
        .width(400)
        .url()
    : srcUrl

  return (
    <Stack space={4}>
      {/* ── thumbnail on top ───────────────────── */}
      {previewUrl && (
        <Card tone="transparent" padding={2} border radius={2}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            style={{
              objectFit   : 'cover',
              width       : '100%',
              maxHeight   : '240px',
              borderRadius: 6,
            }}
            alt="Image preview"
          />
        </Card>
      )}

      {/* ── hand control back to Sanity’s default UI ─ */}
      {props.renderDefault(props)}
    </Stack>
  )
}
// sanity/lib/uploadImage.ts
import { sanityWriteClient } from './client'

export async function uploadImageToSanity(file: File) {
  const asset = await sanityWriteClient.assets.upload('image', file, {
    filename: file.name,
    contentType: file.type,
  })
  // returns CDN URL; if you prefer _ref, return asset._ref
  return asset.url
}
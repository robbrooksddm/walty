import {sanity} from '@/sanity/lib/client'

export interface ProdigiAsset {
  url: string
  printArea: string
}

export interface ProdigiPayload {
  sku: string
  copies: number
  sizing: string
  assets: ProdigiAsset[]
}

export async function getProdigiPayload(
  variantId: string,
  fulfilId: string,
  assets: { url: string }[],
  copies = 1,
): Promise<ProdigiPayload> {
  const id = `${variantId}_${fulfilId}`
  const query = `*[_type=="skuMap" && _id==$id][0]{prodigiSku,printAreaId,sizingStrategy}`
  const map = await sanity.fetch<{prodigiSku:string,printAreaId:string,sizingStrategy:string}>(query, {id})
  if (!map) throw new Error(`SKU mapping not found for ${id}`)

  return {
    sku: map.prodigiSku,
    copies,
    sizing: map.sizingStrategy,
    assets: assets.map(a => ({ url: a.url, printArea: map.printAreaId })),
  }
}

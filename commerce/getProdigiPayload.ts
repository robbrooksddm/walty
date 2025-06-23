import {sanity} from '@/sanity/lib/client'

export interface ProdigiAsset {
  url: string
  printArea: string
}

export interface ProdigiPayload {
  sku: string
  copies: number
  sizing: string
  shippingMethod: string
  assets: ProdigiAsset[]
}

export async function getProdigiPayload(
  variantHandle: string,
  fulfilHandle: string,
  assets: { url: string }[],
  copies = 1,
): Promise<ProdigiPayload> {
  const query = `*[_type=="skuMap" && variant->variantHandle==$v && fulfil->fulfilHandle==$f][0]{prodigiSku,printAreaId,sizingStrategy,"shippingMethod":fulfil->shippingMethod}`
  const map = await sanity.fetch<{prodigiSku:string,printAreaId:string,sizingStrategy:string,shippingMethod:string}>(query, {v: variantHandle, f: fulfilHandle})
  if (!map) throw new Error(`SKU mapping not found for ${variantHandle}_${fulfilHandle}`)

  const printArea = map.printAreaId === 'front' ? 'default' : map.printAreaId
  const shippingMethodFix: Record<string, string> = {
    uk_mail_standard: 'uk_mail_tracked48',
  }
  const shippingMethod = shippingMethodFix[map.shippingMethod] || map.shippingMethod

  return {
    sku: map.prodigiSku,
    copies,
    sizing: map.sizingStrategy,
    shippingMethod,
    assets: assets.map(a => ({ url: a.url, printArea })),
  }
}

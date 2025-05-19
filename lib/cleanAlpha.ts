import sharp from 'sharp';

export async function cleanAlpha(input: Buffer): Promise<Buffer> {
  // Ensure input has an alpha channel and clean it
  const alpha = await sharp(input)
    .ensureAlpha()
    .extractChannel('alpha')
    .threshold()
    .toBuffer();

  const rgb = await sharp(input).removeAlpha().toBuffer();

  return sharp(rgb).joinChannel(alpha).png().toBuffer();
}

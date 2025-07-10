export async function generateCardMockups(frontUrl: string): Promise<Record<string,string>> {
  const load = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

  const background = await load('/mockups/cards/Card_mockups_room_background.jpg');
  const sizes = ['mini','classic','giant'] as const;
  const result: Record<string,string> = {};
  const front = await load(frontUrl);

  for (const size of sizes) {
    const overlay = await load(`/mockups/cards/scene_${size}_overlay.png`);
    const mask = await load(`/mockups/cards/${size}_mask.png`);

    const canvas = document.createElement('canvas');
    canvas.width = background.width;
    canvas.height = background.height;
    const ctx = canvas.getContext('2d')!;

    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.drawImage(mask, 0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-in';
    ctx.drawImage(front, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    ctx.drawImage(overlay, 0, 0, canvas.width, canvas.height);

    result[`gc-${size}`] = canvas.toDataURL('image/png');
  }

  return result;
}

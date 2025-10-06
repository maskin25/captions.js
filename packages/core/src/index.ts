export function renderCaptions(ctx: CanvasRenderingContext2D, text: string) {
  ctx.font = '24px sans-serif';
  ctx.fillStyle = '#fff';
  ctx.fillText(text, 50, 50);
  return true;
}
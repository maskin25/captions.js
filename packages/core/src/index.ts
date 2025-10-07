export function renderCaptions(ctx: CanvasRenderingContext2D, text: string) {
  ctx.font = "24px sans-serif";
  ctx.fillStyle = "#17c499ff";
  ctx.fillText(text, 150, 50);
  return true;
}

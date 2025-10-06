import { renderCaptions } from '@captions/core';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

ctx.fillStyle = 'black';
ctx.fillRect(0, 0, canvas.width, canvas.height);
renderCaptions(ctx, 'Hello from captions.js!');

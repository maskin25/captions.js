import {
  loadGoogleFont,
  loadGoogleFont2,
} from "./../fonts/googleFonts.helpers";
import Konva from "konva";
import { StylePreset } from "./../stylePresets/stylePresets.config";
import { googleFontsList } from "./../fonts/googleFonts.config";

/**
 * Server/worker-friendly helper that paints a text string onto a provided canvas.
 *
 * @remarks
 * Uses the same Konva pipeline as the video overlay renderer so the results
 * match what users see in the browser.
 *
 * @param canvas - Destination canvas that should receive the rendered text.
 * @param text - Arbitrary content that needs to be painted.
 * @param options - Rendering options that include the style preset.
 * @returns Resolves once the frame has been painted (always resolves to `true`).
 */
export async function renderString(
  canvas: HTMLCanvasElement,
  text: string,
  options: { preset: StylePreset }
) {
  const { preset } = options;

  // then read its size
  const width = parseInt(canvas.style.width);
  const height = parseInt(canvas.style.height);

  // Create a temporary container for Konva
  const container = document.createElement("div");
  //document.body.appendChild(container);

  var stage = new Konva.Stage({
    container: container,
    width: width,
    height: height,
  });

  console.log("width, height", width, height);

  // then create layer
  var layer = new Konva.Layer();

  // add the layer to the stage
  stage.add(layer);

  await loadGoogleFont2(
    preset.captionsSettings.style.font
      .fontFamily as (typeof googleFontsList)[number]
  );

  // We need to wait for the next frame to make sure the font is loaded
  // and applied by Konva.
  await new Promise((resolve) => requestAnimationFrame(resolve));

  // create a black background
  const background = new Konva.Rect({
    x: 0,
    y: 0,
    width: width,
    height: height,
    fill: "black",
  });
  layer.add(background);

  // Draw captions using Konva

  const textOptions = {
    x: width / 2,
    y: height / 2,
    text: text,
    fontSize: preset.captionsSettings.style.font.fontSize,
    fontFamily: preset.captionsSettings.style.font.fontFamily,
    fill: preset.captionsSettings.style.font.fontColor,
    align: "center",
    offsetX: 0,
    offsetY: 0,
  };

  console.log("textOptions", textOptions);

  const konvaText = new Konva.Text(textOptions);

  konvaText.offsetX(konvaText.width() / 2);
  konvaText.offsetY(konvaText.height() / 2);

  layer.add(konvaText);
  layer.draw();

  // Copy the Konva canvas to the provided canvas
  const konvaCanvas = layer.getCanvas()._canvas as HTMLCanvasElement;
  const konvaContext = konvaCanvas.getContext("2d");

  if (konvaContext) {
    const targetContext = canvas.getContext("2d");
    if (targetContext) {
      targetContext.setTransform(
        Konva.pixelRatio,
        0,
        0,
        Konva.pixelRatio,
        0,
        0
      );
      targetContext.drawImage(konvaCanvas, 0, 0, width, height);
    }
  }

  return true;
}

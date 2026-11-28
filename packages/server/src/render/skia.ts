// Konva on skia-canvas, drawing on the CPU.
//
// skia-canvas renders on the GPU (Vulkan or Metal) when it finds one. On a
// machine with a GPU that made the process crash with a segmentation fault
// now and then while Node exited, after the video was already written, and it
// draws slightly different pixels from the CPU path that CI and most servers
// use. Captions are small 2D overlays, so the CPU is fast enough and gives the
// same frames everywhere. Set CAPTIONSJS_GPU=1 to let skia-canvas use the GPU.
import Konva from "konva";
import "konva/skia-backend";

const useGpu = process.env.CAPTIONSJS_GPU === "1";

if (!useGpu) {
  const create = Konva.Util.createCanvasElement;
  Konva.Util.createCanvasElement = () => {
    const canvas = create() as ReturnType<typeof create> & { gpu?: boolean };
    canvas.gpu = false;
    return canvas;
  };
}

export default Konva;

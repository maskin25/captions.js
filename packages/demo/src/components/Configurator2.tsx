import { ScrollArea } from "./ui/scroll-area";

const sampleSettings = {
  style: {
    name: "Bold Pop",
    font: {
      fontFamily: "Space Grotesk",
      fontSize: 64,
      fontColor: "#ffffff",
      fontStrokeColor: "#1d4ed8",
      fontStrokeWidth: 6,
      shadow: {
        fontShadowColor: "#000000",
        fontShadowBlur: 12,
        fontShadowOffsetX: 0,
        fontShadowOffsetY: 6,
      },
    },
    backgroundColor: "#0f172a",
  },
  layout: {
    position: "bottom",
    positionTopOffset: 56,
    linesPerPage: 2,
  },
};

export default function Configurator2() {
  return (
    <div className="flex h-[calc(100vh-4rem-1px)] max-h-[calc(100vh-4rem-1px)] flex-col overflow-hidden bg-slate-950 text-slate-100">
      <section className="flex flex-1 min-h-0 gap-4 p-6">
        <aside className="flex w-[300px] flex-shrink-0 flex-col gap-4 rounded-2xl border border-white/5 bg-white/5 p-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
              Example Settings
            </p>
            <h2 className="text-lg font-semibold">Preset: Bold Pop</h2>
          </div>

          <div className="space-y-3 text-sm leading-relaxed">
            <div>
              <p className="text-slate-400">Font</p>
              <p className="font-medium">
                {sampleSettings.style.font.fontFamily} ·{" "}
                {sampleSettings.style.font.fontSize}px
              </p>
            </div>
            <div>
              <p className="text-slate-400">Colors</p>
              <div className="mt-2 flex gap-3 text-xs">
                <ColorSwatch label="Text" value="#ffffff" />
                <ColorSwatch label="Stroke" value="#1d4ed8" />
                <ColorSwatch label="Shadow" value="#000000" />
              </div>
            </div>
            <div>
              <p className="text-slate-400">Layout</p>
              <p className="font-medium">
                Bottom · {sampleSettings.layout.linesPerPage} lines
              </p>
            </div>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col gap-4 rounded-2xl border border-white/5 bg-gradient-to-b from-slate-900 to-slate-950 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                Preview
              </p>
              <h1 className="text-2xl font-semibold">Configurator Prototype</h1>
            </div>
            <button className="rounded-full border border-white/20 px-4 py-1 text-sm font-medium text-white transition hover:border-white/60">
              Save Draft
            </button>
          </div>

          <div className="flex flex-1 min-h-0 items-center justify-center rounded-xl border border-white/5 bg-slate-900/60 p-6">
            <div className="relative flex aspect-video w-full max-w-3xl items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-10">
              <div className="absolute inset-x-6 bottom-10 rounded-xl bg-white/10 px-8 py-6 shadow-xl backdrop-blur">
                <p className="text-center text-3xl font-semibold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
                  Your captions will look this bold.
                </p>
                <p className="text-center text-lg text-cyan-200/80">
                  Keep the pacing in mind while you iterate.
                </p>
              </div>
              <span className="text-sm uppercase tracking-[0.4em] text-white/40">
                Video Canvas
              </span>
            </div>
          </div>
        </main>

        <aside className="flex w-[300px] flex-shrink-0 flex-col gap-4 rounded-2xl border border-white/5 bg-white/5 p-4">
          <header>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
              Presets
            </p>
            <h2 className="text-lg font-semibold">Quick Selection</h2>
          </header>
          <ul className="space-y-2 text-sm">
            {["Clean Minimal", "Bold Pop", "Retro VHS", "Neon Fade"].map(
              (preset) => (
                <li
                  key={preset}
                  className={`rounded-xl border border-white/10 px-3 py-2 ${
                    preset === "Bold Pop"
                      ? "bg-white/20 text-white"
                      : "text-slate-200"
                  }`}
                >
                  {preset}
                </li>
              )
            )}
          </ul>
          <div className="rounded-xl border border-dashed border-white/20 p-3 text-center text-xs text-slate-300">
            Drop new preset JSON to import quickly
          </div>
        </aside>
      </section>

      <footer className="h-96 border-t border-white/10 bg-slate-900 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
              Captions Settings
            </p>
            <h3 className="text-base font-medium text-white">JSON Preview</h3>
          </div>
          <button className="rounded-full border border-white/20 px-3 py-1 text-xs font-medium text-white transition hover:border-white/60">
            Copy JSON
          </button>
        </div>
        <ScrollArea className="mt-3 h-[calc(100%-3rem)] overflow-auto rounded-xl border border-white/5 bg-slate-950 p-4 text-xs text-slate-200">
          <div>
            <pre className="whitespace-pre-wrap font-mono leading-tight">
              {JSON.stringify(sampleSettings, null, 2)}
            </pre>
          </div>
        </ScrollArea>
      </footer>
    </div>
  );
}

type ColorSwatchProps = {
  label: string;
  value: string;
};

function ColorSwatch({ label, value }: ColorSwatchProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1">
      <span
        className="h-4 w-4 rounded-full border border-white/30"
        style={{ backgroundColor: value }}
      />
      <div>
        <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">
          {label}
        </p>
        <p className="font-mono text-[11px]">{value}</p>
      </div>
    </div>
  );
}

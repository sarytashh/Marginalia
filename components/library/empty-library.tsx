import { PageIntro } from "@/components/page-intro";

const steps = [
  {
    title: "Read pages",
    detail: "Every page is extracted as text and kept with its page number.",
  },
  {
    title: "Find topics",
    detail: "The material is grouped into the ideas it actually covers.",
  },
  {
    title: "Prepare questions",
    detail: "Each question is written from your passages, and cites them.",
  },
];

type EmptyLibraryProps = {
  onChoosePdf: () => void;
};

export function EmptyLibrary({ onChoosePdf }: EmptyLibraryProps) {
  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_240px] lg:gap-16">
      <div>
        <PageIntro
          label="Library"
          title="Turn your lecture slides into questions you can answer."
          description="Upload a PDF. Marginalia reads the text, finds its topics, and prepares a study session grounded in your own material."
        />

        <div className="border-rule bg-paper mt-10 min-h-[240px] rounded-sm border px-6 py-12 md:px-10 md:py-16">
          <div className="flex min-h-[140px] flex-col items-start justify-center gap-4 sm:flex-row sm:items-center sm:gap-5">
            <button
              type="button"
              onClick={onChoosePdf}
              className="bg-burgundy text-paper hover:bg-burgundy-hover inline-flex min-h-11 items-center rounded-sm px-4 text-[14px] font-medium transition-colors duration-200 ease-out"
            >
              Choose a PDF
            </button>
            <p className="text-muted-ink text-[14px]">
              or drop it anywhere on this page.
            </p>
          </div>
        </div>
      </div>

      <aside className="border-rule border-t pt-6 lg:border-t-0 lg:border-l lg:pt-2 lg:pl-8">
        <h2 className="label-editorial">What happens next</h2>
        <ol className="mt-5 space-y-5">
          {steps.map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <span className="text-muted-ink font-serif text-[15px] tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>
                <span className="text-ink block text-[14px] font-medium">
                  {step.title}
                </span>
                <span className="text-muted-ink mt-1 block text-[13px] leading-[1.6]">
                  {step.detail}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </aside>
    </div>
  );
}

import { PageIntro } from "@/components/page-intro";
import { PageShell } from "@/components/page-shell";

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

export default function LibraryPage() {
  return (
    <PageShell>
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_240px] lg:gap-16">
        <PageIntro
          label="Library"
          title="Turn your lecture slides into questions you can answer."
          description="Upload a PDF. Marginalia reads the text, finds its topics, and prepares a study session grounded in your own material."
        />

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
    </PageShell>
  );
}

import { StudySkeletons } from "@/components/study/study-skeletons";

export default function StudyLoading() {
  return (
    <div data-study-frame>
      <header className="border-rule bg-canvas sticky top-0 z-40 border-b">
        <div className="max-w-app mx-auto flex h-14 w-full items-center gap-4 px-5 md:h-16 md:px-8 lg:px-12">
          <p className="font-serif text-ink text-[22px] leading-none md:text-[26px]">
            Marginalia
          </p>
        </div>
      </header>
      <div className="mx-auto w-full max-w-[45rem] px-5 pt-8 pb-28 md:px-8 md:pt-12">
        <StudySkeletons />
      </div>
    </div>
  );
}

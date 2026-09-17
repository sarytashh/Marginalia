import type { ReactNode } from "react";

type PageIntroProps = {
  label: string;
  title: string;
  description: string;
  children?: ReactNode;
};

export function PageIntro({
  label,
  title,
  description,
  children,
}: PageIntroProps) {
  return (
    <div className="max-w-reading">
      <p className="label-editorial">{label}</p>
      <h1 className="font-serif text-ink mt-4 text-[34px] leading-[1.12] font-normal text-balance md:text-[52px]">
        {title}
      </h1>
      <p className="text-muted-ink mt-5 max-w-[34rem] text-[16px] leading-[1.65]">
        {description}
      </p>
      {children}
    </div>
  );
}

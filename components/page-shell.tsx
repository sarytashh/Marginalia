import type { ReactNode } from "react";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-app mx-auto w-full px-5 py-10 md:px-8 md:py-20 lg:px-12">
      {children}
    </div>
  );
}

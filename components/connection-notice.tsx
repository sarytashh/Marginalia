"use client";

import { useEffect, useState } from "react";

export function ConnectionNotice() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    function sync() {
      setOffline(!window.navigator.onLine);
    }

    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (!offline) {
    return null;
  }

  return (
    <div
      role="status"
      className="border-rule bg-paper text-ink border-b px-5 py-2 text-center text-[13px] leading-[1.55] md:px-8"
    >
      You appear to be offline. Your current answer will stay here.
    </div>
  );
}

"use client";

import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <h2 className="text-2xl font-extrabold text-ink">কিছু সমস্যা হয়েছে · Something went wrong</h2>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 rounded-full bg-brand px-6 py-2.5 font-bold text-white shadow-cta hover:bg-brand-dark"
      >
        আবার চেষ্টা করুন · Try Again
      </button>
    </div>
  );
}

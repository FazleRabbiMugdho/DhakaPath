import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-extrabold text-ink">404</h1>
      <p className="mt-2 text-ink-soft">পৃষ্ঠাটি পাওয়া যায়নি · Page not found</p>
      <Link href="/" className="mt-6 rounded-full bg-brand px-6 py-2.5 font-bold text-white shadow-cta hover:bg-brand-dark">
        হোমে ফিরুন · Back to Home
      </Link>
    </div>
  );
}

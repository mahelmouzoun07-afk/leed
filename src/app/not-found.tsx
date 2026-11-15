import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-[560px] flex-col items-center justify-center px-4 text-center">
      <h1 className="!text-3xl !font-semibold">404 — Page Not Found</h1>
      <p className="!mt-3 text-base">Sorry, the page you are looking for does not exist or has been moved.</p>
      <Link href="/" className="cta-primary mt-6 rounded-lg px-6 py-3 font-medium">
        Go to Homepage
      </Link>
    </div>
  );
}

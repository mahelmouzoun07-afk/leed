import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-[560px] flex-col items-center justify-center px-4 text-center">
      <h1 className="!text-3xl !font-semibold">404 : page introuvable</h1>
      <p className="!mt-3 text-base">Désolé, cette page n&apos;existe pas ou a été déplacée.</p>
      <Link href="/" className="cta-primary mt-6 rounded-lg px-6 py-3 font-medium">
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}

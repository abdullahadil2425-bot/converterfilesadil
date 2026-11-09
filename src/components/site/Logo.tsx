import { Link } from "@tanstack/react-router";

export function LogoMark({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="12" fill="var(--primary)" />
      <path d="M13 9h10l6 6v14a3 3 0 0 1-3 3H13a3 3 0 0 1-3-3V12a3 3 0 0 1 3-3Z" fill="var(--paper)" />
      <path d="M23 9v4a2 2 0 0 0 2 2h4Z" fill="var(--sun)" />
      <path d="M14.5 22.5h8m0 0-3-3m3 3-3 3" stroke="var(--primary)" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="PDFKor home">
      <LogoMark />
      <span dir="ltr" className="font-display text-xl font-semibold tracking-tight text-foreground">
        <span className="text-primary">PDF</span>Kor
      </span>
    </Link>
  );
}

"use client";

import Link from "next/link";

type Action =
  | { kind: "reset"; onClick: () => void; label?: string }
  | { kind: "home"; href?: string; label?: string };

type ErrorFallbackProps = {
  title: string;
  message: string;
  action?: Action;
};

export function ErrorFallback({ title, message, action }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="text-center max-w-md w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://axis-experts.be/wp-content/uploads/2022/12/Axis-Logo-01.png"
          alt="Axis Experts"
          className="mx-auto mb-8"
          style={{ height: "60px", objectFit: "contain" }}
        />

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary-light flex items-center justify-center">
            <svg
              className="w-7 h-7 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01M4.93 19h14.14c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.2 16c-.77 1.33.19 3 1.73 3z"
              />
            </svg>
          </div>

          <h1 className="text-xl font-bold text-gray-800 mb-2">{title}</h1>
          <p className="text-gray-500 text-sm leading-relaxed">{message}</p>

          <div className="mt-6 pt-6 border-t border-gray-100 text-left space-y-3">
            <div className="text-sm">
              <span className="font-medium text-gray-700">Téléphone : </span>
              {/* TODO Nicolas: numéro Axis Experts */}
              <span className="text-gray-500">
                [À COMPLÉTER : numéro Axis Experts]
              </span>
            </div>
            <div className="text-sm">
              <span className="font-medium text-gray-700">Email : </span>
              <a
                href="mailto:info@axis-experts.be"
                className="text-primary hover:underline"
              >
                info@axis-experts.be
              </a>
            </div>
            <div className="text-sm">
              <span className="font-medium text-gray-700">Horaires : </span>
              {/* TODO Nicolas: horaires */}
              <span className="text-gray-500">
                [À COMPLÉTER : horaires d&apos;ouverture]
              </span>
            </div>
          </div>

          {action && (
            <div className="mt-6">
              {action.kind === "reset" ? (
                <button
                  type="button"
                  onClick={action.onClick}
                  className="inline-flex items-center justify-center h-9 px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary-dark transition-colors shadow-sm"
                >
                  {action.label ?? "Réessayer"}
                </button>
              ) : (
                <Link
                  href={action.href ?? "/"}
                  className="inline-flex items-center justify-center h-9 px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary-dark transition-colors shadow-sm"
                >
                  {action.label ?? "Retour à l'accueil"}
                </Link>
              )}
            </div>
          )}
        </div>

        <p className="mt-6 text-xs text-gray-400">
          Axis Experts SRL —{" "}
          <a
            href="mailto:info@axis-experts.be"
            className="hover:underline"
          >
            info@axis-experts.be
          </a>
        </p>
      </div>
    </div>
  );
}

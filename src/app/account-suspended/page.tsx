"use client";

import Link from "next/link";

export default function AccountSuspendedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://axis-experts.be/wp-content/uploads/2022/12/Axis-Logo-01.png"
          alt="Axis Experts"
          className="mx-auto mb-8"
          style={{ height: "60px", objectFit: "contain" }}
        />

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
            <svg
              className="w-7 h-7 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </div>

          <h1 className="text-xl font-bold text-gray-800 mb-2">
            Acces suspendu
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Votre acces a ete suspendu. Contactez Axis Experts pour plus
            d&apos;informations.
          </p>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <Link
              href="/login"
              className="text-sm text-primary hover:underline"
            >
              Retour a la page de connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

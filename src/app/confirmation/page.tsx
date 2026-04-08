"use client";

import { useRouter } from "next/navigation";

export default function ConfirmationPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
          <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-dark mb-3">Demande envoyée !</h1>
        <p className="text-gray-500 mb-8">
          Votre demande de rendez-vous a été transmise avec succès. Un devis a été créé
          automatiquement et un email de confirmation vous a été envoyé.
        </p>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6 mb-8">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-dark text-sm">Prochaine étape</p>
              <p className="text-gray-500 text-sm">
                Notre équipe vous recontactera dans les plus brefs délais pour confirmer la date du rendez-vous.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary-dark transition-colors"
          >
            Retour au tableau de bord
          </button>
          <button
            onClick={() => router.push("/demande")}
            className="px-6 py-3 rounded-full border-2 border-primary text-primary font-semibold hover:bg-primary/5 transition-colors"
          >
            Nouvelle demande
          </button>
        </div>
      </div>
    </div>
  );
}

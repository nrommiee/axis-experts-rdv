"use client";

interface DactyloHeaderProps {
  userEmail: string | null;
  hasUploadingRow: boolean;
  onLogout: () => Promise<void> | void;
}

export function DactyloHeader({
  userEmail,
  hasUploadingRow,
  onLogout,
}: DactyloHeaderProps) {
  const handleLogoutClick = async () => {
    if (hasUploadingRow) {
      const confirmed = window.confirm(
        "Un envoi est en cours. Êtes-vous sûr de vouloir vous déconnecter ?"
      );
      if (!confirmed) return;
    }
    await onLogout();
  };

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <h1 className="text-base font-semibold tracking-tight text-gray-900">
          Axis Experts
          <span className="mx-2 text-gray-300">—</span>
          <span className="text-gray-600">Dactylo</span>
        </h1>
        <div className="flex items-center gap-4 text-sm">
          {userEmail && (
            <span className="max-w-[200px] truncate text-gray-500">
              {userEmail}
            </span>
          )}
          <button
            type="button"
            onClick={handleLogoutClick}
            className="text-gray-500 transition-colors hover:text-gray-900"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </header>
  );
}

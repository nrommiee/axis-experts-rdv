import { z } from "zod";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { fr } from "date-fns/locale";

export const RDV_HOUR_MIN = 8;
export const RDV_HOUR_MAX = 19;
export const RDV_MINUTE_STEP = 30;
export const RDV_TIMEZONE = "Europe/Brussels";

const ISO_REGEX =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/;

export type RdvDateValidation = { ok: true } | { ok: false; reason: string };

function padHour(hour: number): string {
  return `${String(hour).padStart(2, "0")}h00`;
}

export function isDateValid(
  iso: string,
  now: Date = new Date(),
): RdvDateValidation {
  if (typeof iso !== "string" || iso.length === 0) {
    return { ok: false, reason: "Sélectionnez la date du rendez-vous." };
  }
  if (!ISO_REGEX.test(iso)) {
    return { ok: false, reason: "Format de date invalide." };
  }
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return { ok: false, reason: "Format de date invalide." };
  }
  if (parsed.getTime() <= now.getTime()) {
    return {
      ok: false,
      reason: "Le rendez-vous doit être planifié dans le futur.",
    };
  }

  const zoned = toZonedTime(parsed, RDV_TIMEZONE);
  const hour = zoned.getHours();
  const minute = zoned.getMinutes();

  const outOfRange =
    hour < RDV_HOUR_MIN ||
    hour > RDV_HOUR_MAX ||
    (hour === RDV_HOUR_MAX && minute > 0);
  if (outOfRange) {
    return {
      ok: false,
      reason: `L'heure doit être comprise entre ${padHour(RDV_HOUR_MIN)} et ${padHour(RDV_HOUR_MAX)} (heure belge).`,
    };
  }

  if (minute % RDV_MINUTE_STEP !== 0) {
    return {
      ok: false,
      reason: "Les créneaux sont par tranches de 30 minutes (00 ou 30).",
    };
  }

  return { ok: true };
}

export const rdvDateSchema = z
  .string({ message: "Sélectionnez la date du rendez-vous." })
  .superRefine((value, ctx) => {
    const result = isDateValid(value);
    if (!result.ok) {
      ctx.addIssue({ code: "custom", message: result.reason });
    }
  });

export type RdvDate = z.infer<typeof rdvDateSchema>;

export function formatRdvDateTimeFr(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "";
  const day = formatInTimeZone(parsed, RDV_TIMEZONE, "EEEE d MMMM yyyy", {
    locale: fr,
  });
  const time = formatInTimeZone(parsed, RDV_TIMEZONE, "HH'h'mm", {
    locale: fr,
  });
  return `${day} à ${time}`;
}

import { z } from "zod";
import { formatInTimeZone } from "date-fns-tz";
import { fr } from "date-fns/locale";

export const RDV_TIMEZONE = "Europe/Brussels";
export const RDV_MAX_RANGE_DAYS = 30;

const YMD_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export type RdvDateRange = {
  dateDebut: string;
  dateFin: string;
};

export type RdvRangeValidation = { ok: true } | { ok: false; reason: string };

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function todayYmdInZone(timezone: string, now: Date = new Date()): string {
  return formatInTimeZone(now, timezone, "yyyy-MM-dd");
}

function ymdToUtcEpoch(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function isYmdValid(ymd: string): boolean {
  if (!YMD_REGEX.test(ymd)) return false;
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}

export function isDateRangeValid(
  range: { dateDebut?: unknown; dateFin?: unknown },
  now: Date = new Date(),
): RdvRangeValidation {
  const { dateDebut, dateFin } = range;

  if (typeof dateDebut !== "string" || dateDebut.length === 0) {
    return { ok: false, reason: "Sélectionnez une date de début." };
  }
  if (typeof dateFin !== "string" || dateFin.length === 0) {
    return { ok: false, reason: "Sélectionnez une date de fin." };
  }
  if (!isYmdValid(dateDebut) || !isYmdValid(dateFin)) {
    return { ok: false, reason: "Format de date invalide (AAAA-MM-JJ)." };
  }

  const todayYmd = todayYmdInZone(RDV_TIMEZONE, now);
  const todayEpoch = ymdToUtcEpoch(todayYmd);
  const debutEpoch = ymdToUtcEpoch(dateDebut);
  const finEpoch = ymdToUtcEpoch(dateFin);

  if (debutEpoch < todayEpoch) {
    return {
      ok: false,
      reason: "La date de début doit être aujourd'hui ou dans le futur.",
    };
  }
  if (finEpoch < debutEpoch) {
    return {
      ok: false,
      reason: "La date de fin doit être postérieure ou égale à la date de début.",
    };
  }

  const diffDays = Math.round((finEpoch - debutEpoch) / MS_PER_DAY);
  if (diffDays > RDV_MAX_RANGE_DAYS) {
    return {
      ok: false,
      reason: `La fourchette ne peut pas dépasser ${RDV_MAX_RANGE_DAYS} jours.`,
    };
  }

  return { ok: true };
}

export const rdvDateRangeSchema = z
  .object({
    dateDebut: z.string({ message: "Date de début requise." }),
    dateFin: z.string({ message: "Date de fin requise." }),
  })
  .superRefine((value, ctx) => {
    const result = isDateRangeValid(value);
    if (!result.ok) {
      ctx.addIssue({ code: "custom", message: result.reason });
    }
  });

export type RdvDateRangeInput = z.infer<typeof rdvDateRangeSchema>;

function formatSingleDayFr(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return formatInTimeZone(date, RDV_TIMEZONE, "EEEE d MMMM yyyy", {
    locale: fr,
  });
}

function formatRangeDayFr(ymd: string, includeYear: boolean): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const pattern = includeYear ? "EEEE d MMMM yyyy" : "EEEE d MMMM";
  return formatInTimeZone(date, RDV_TIMEZONE, pattern, { locale: fr });
}

export function formatRdvDateRangeFr(range: {
  dateDebut?: string | null;
  dateFin?: string | null;
}): string {
  const { dateDebut, dateFin } = range;
  if (!dateDebut || !isYmdValid(dateDebut)) return "";
  if (!dateFin || !isYmdValid(dateFin)) {
    return `le ${formatSingleDayFr(dateDebut)}`;
  }
  if (dateDebut === dateFin) {
    return `le ${formatSingleDayFr(dateDebut)}`;
  }
  const [yDebut] = dateDebut.split("-").map(Number);
  const [yFin] = dateFin.split("-").map(Number);
  const sameYear = yDebut === yFin;
  const debutLabel = formatRangeDayFr(dateDebut, !sameYear);
  const finLabel = formatRangeDayFr(dateFin, true);
  return `du ${debutLabel} au ${finLabel}`;
}

"use client";

import * as React from "react";
import { AlertCircle, CalendarIcon, ChevronDownIcon } from "lucide-react";
import type { DateRange, Matcher } from "react-day-picker";
import { fr as frLocale } from "react-day-picker/locale";
import { formatInTimeZone } from "date-fns-tz";
import { addDays, isSameDay } from "date-fns";

import { Button, buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  RDV_MAX_RANGE_DAYS,
  RDV_TIMEZONE,
  formatRdvDateRangeFr,
  isDateRangeValid,
} from "@/lib/validation/rdvDateSchema";

export type RangeValue = {
  dateDebut: string | null;
  dateFin: string | null;
};

export interface DateRangePickerProps {
  value: RangeValue;
  onChange: (range: RangeValue) => void;
  disabled?: boolean;
  error?: string;
  minDate?: Date;
  maxRangeDays?: number;
  label?: string;
  required?: boolean;
  id?: string;
  placeholder?: string;
}

function ymdToLocalDate(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function localDateToYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfTodayInZone(timezone: string, now: Date = new Date()): Date {
  const ymd = formatInTimeZone(now, timezone, "yyyy-MM-dd");
  return ymdToLocalDate(ymd);
}

export function DateRangePicker({
  value,
  onChange,
  disabled = false,
  error,
  minDate,
  maxRangeDays = RDV_MAX_RANGE_DAYS,
  label,
  required = false,
  id,
  placeholder = "Sélectionnez une fourchette de dates",
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [hoveredDate, setHoveredDate] = React.useState<Date | null>(null);
  // Mid-selection (Booking-style): user has clicked `from` but not yet `to`.
  // Kept internal so the parent never sees an incomplete range (which would
  // make rdvDateValidation flip to ok and downstream effects close the popover).
  const [pendingFrom, setPendingFrom] = React.useState<Date | null>(null);
  const effectiveMin = React.useMemo(
    () => minDate ?? startOfTodayInZone(RDV_TIMEZONE),
    [minDate],
  );

  React.useEffect(() => {
    if (!open) {
      setPendingFrom(null);
      setHoveredDate(null);
    }
  }, [open]);

  // Visual selection passed to rdp. We deliberately do NOT display a
  // previously-committed range inside the calendar, only the internal
  // `pendingFrom` while the user is mid-selection. The trigger button still
  // shows the committed range via `displayLabel`. Reason: if we pass a
  // complete range as `selected`, rdp's `addToRange` would mutate one of the
  // existing endpoints on the next click instead of starting a fresh
  // selection, making it impossible to reliably tell which date the user
  // actually clicked.
  const selectedRange: DateRange | undefined = React.useMemo(() => {
    if (pendingFrom) return { from: pendingFrom, to: undefined };
    return undefined;
  }, [pendingFrom]);

  // Initial month displayed when picker opens: pendingFrom > committed value
  // > minDate.
  const defaultMonth = React.useMemo(() => {
    if (pendingFrom) return pendingFrom;
    if (value.dateDebut) return ymdToLocalDate(value.dateDebut);
    return effectiveMin;
  }, [pendingFrom, value.dateDebut, effectiveMin]);

  const previewRange = React.useMemo(() => {
    if (!pendingFrom || !hoveredDate) return null;
    if (isSameDay(hoveredDate, pendingFrom)) return null;
    const [start, end] =
      hoveredDate > pendingFrom
        ? [addDays(pendingFrom, 1), hoveredDate]
        : [hoveredDate, addDays(pendingFrom, -1)];
    return { start, end };
  }, [pendingFrom, hoveredDate]);

  const modifiers = React.useMemo(
    () => ({
      weekend: (date: Date) => {
        const day = date.getDay();
        return day === 0 || day === 6;
      },
      rangePreview: previewRange
        ? { after: addDays(previewRange.start, -1), before: addDays(previewRange.end, 1) }
        : () => false,
    }),
    [previewRange],
  );

  const modifiersClassNames = React.useMemo(
    () => ({
      weekend: "text-muted-foreground/70",
      rangePreview: "bg-accent/40 text-accent-foreground rounded-none",
    }),
    [],
  );

  const disabledMatchers = React.useMemo<Matcher[]>(() => {
    const matchers: Matcher[] = [{ before: effectiveMin }];
    if (pendingFrom) {
      matchers.push({
        after: addDays(pendingFrom, maxRangeDays),
      });
    }
    return matchers;
  }, [effectiveMin, pendingFrom, maxRangeDays]);

  // 2-month layout on desktop, 1-month on small screens (Booking-style).
  // Uses matchMedia tied to Tailwind's `md` breakpoint (768px).
  const [numberOfMonths, setNumberOfMonths] = React.useState(1);
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(min-width: 768px)");
    const apply = () => setNumberOfMonths(mql.matches ? 2 : 1);
    apply();
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, []);

  const triggerId = id ?? "date-range-picker-trigger";
  const labelId = `${triggerId}-label`;
  const errorId = `${triggerId}-error`;

  const displayLabel = React.useMemo(() => {
    if (!value.dateDebut) return placeholder;
    return formatRdvDateRangeFr({
      dateDebut: value.dateDebut,
      dateFin: value.dateFin,
    });
  }, [value.dateDebut, value.dateFin, placeholder]);

  const handleSelect = (range: DateRange | undefined) => {
    if (!range || !range.from) {
      setPendingFrom(null);
      if (value.dateDebut || value.dateFin) {
        onChange({ dateDebut: null, dateFin: null });
      }
      return;
    }

    // ── First click: no pending selection yet. ──
    // react-day-picker v9 quirk: when `selected` is undefined and `min=0`
    // (default), the first click returns `{from: X, to: X}` — BOTH endpoints
    // defined, not `{from: X, to: undefined}` as one might expect. See
    // node_modules/react-day-picker/.../utils/addToRange.js line 19-22:
    //   range = { from: date, to: min > 0 ? undefined : date };
    // We treat that first click as a `from`-only pending selection — popover
    // stays open until the user clicks `to`.
    if (!pendingFrom) {
      setPendingFrom(range.from);
      setHoveredDate(null);
      // Clear any previously-committed range so the parent's
      // rdvDateValidation doesn't stay `ok` with a stale dateFin.
      if (value.dateDebut || value.dateFin) {
        onChange({ dateDebut: null, dateFin: null });
      }
      return;
    }

    // ── Second click: pendingFrom is set. ──
    // rdp now sees `selected = {from: pendingFrom, to: undefined}` and returns:
    //   • Y > pendingFrom         → {from: pendingFrom, to: Y}    (forward range)
    //   • Y === pendingFrom       → {from: pendingFrom, to: Y}    (1-day range, valid)
    //   • Y < pendingFrom         → {from: Y, to: pendingFrom}    (rdp swaps endpoints)
    if (!range.to) {
      // Edge — rdp didn't fill `to`. Treat the new date as the next pending.
      setPendingFrom(range.from);
      return;
    }

    // Booking-style reset: if the user clicked BEFORE the pendingFrom, rdp
    // swapped the endpoints so the original pending became `to`. In that case
    // we restart the selection at the new (earlier) click rather than
    // committing an inverted range.
    if (
      isSameDay(range.to, pendingFrom) &&
      !isSameDay(range.from, pendingFrom)
    ) {
      setPendingFrom(range.from);
      return;
    }

    const dateDebut = localDateToYmd(range.from);
    const dateFin = localDateToYmd(range.to);
    const validation = isDateRangeValid({ dateDebut, dateFin });
    if (!validation.ok) {
      // Out of range (>30j or before today). Re-anchor pendingFrom to the
      // latest click so the user can pick a valid `to`.
      setPendingFrom(range.to);
      return;
    }
    setPendingFrom(null);
    setHoveredDate(null);
    onChange({ dateDebut, dateFin });
    // Short delay so the user sees the completed range highlight
    // before the popover closes (Booking-style).
    window.setTimeout(() => setOpen(false), 180);
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={triggerId} id={labelId} className="px-1">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      <Popover open={open} onOpenChange={(o) => !disabled && setOpen(o)}>
        <PopoverTrigger asChild>
          <Button
            id={triggerId}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-labelledby={label ? labelId : undefined}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              "w-full justify-between font-normal",
              !value.dateDebut && "text-muted-foreground",
              error && "border-destructive focus-visible:ring-destructive",
            )}
          >
            <span className="flex items-center gap-2">
              <CalendarIcon className="size-4" />
              <span className="truncate">{displayLabel}</span>
            </span>
            <ChevronDownIcon className="size-4 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Calendar
            mode="range"
            selected={selectedRange}
            onSelect={handleSelect}
            onDayMouseEnter={(date) => setHoveredDate(date)}
            onDayMouseLeave={() => setHoveredDate(null)}
            defaultMonth={defaultMonth}
            disabled={disabledMatchers}
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
            classNames={{
              day_button: cn(
                buttonVariants({ variant: "ghost" }),
                "h-10 w-10 sm:h-9 sm:w-9 p-0 font-normal aria-selected:opacity-100",
              ),
            }}
            locale={frLocale}
            weekStartsOn={1}
            numberOfMonths={numberOfMonths}
          />
          <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
            Fourchette max : {maxRangeDays} jours.
          </div>
        </PopoverContent>
      </Popover>
      {error && (
        <p
          id={errorId}
          role="alert"
          className="flex items-center gap-1 px-1 text-sm text-destructive"
        >
          <AlertCircle className="size-4" aria-hidden />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

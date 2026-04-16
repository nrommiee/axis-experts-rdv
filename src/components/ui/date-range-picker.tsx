"use client";

import * as React from "react";
import { AlertCircle, CalendarIcon, ChevronDownIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { fr as frLocale } from "react-day-picker/locale";
import { formatInTimeZone } from "date-fns-tz";

import { Button } from "@/components/ui/button";
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
  const effectiveMin = React.useMemo(
    () => minDate ?? startOfTodayInZone(RDV_TIMEZONE),
    [minDate],
  );

  const selectedRange: DateRange | undefined = React.useMemo(() => {
    if (!value.dateDebut) return undefined;
    return {
      from: ymdToLocalDate(value.dateDebut),
      to: value.dateFin ? ymdToLocalDate(value.dateFin) : undefined,
    };
  }, [value.dateDebut, value.dateFin]);

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
      onChange({ dateDebut: null, dateFin: null });
      return;
    }
    const dateDebut = localDateToYmd(range.from);
    const dateFin = range.to ? localDateToYmd(range.to) : dateDebut;
    onChange({ dateDebut, dateFin });
    if (range.to) {
      const validation = isDateRangeValid({ dateDebut, dateFin });
      if (validation.ok) setOpen(false);
    }
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
            defaultMonth={selectedRange?.from ?? effectiveMin}
            disabled={{ before: effectiveMin }}
            locale={frLocale}
            weekStartsOn={1}
            numberOfMonths={1}
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

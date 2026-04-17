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
  const effectiveMin = React.useMemo(
    () => minDate ?? startOfTodayInZone(RDV_TIMEZONE),
    [minDate],
  );

  const selectedRange: DateRange | undefined = React.useMemo(() => {
    if (!value.dateDebut) return undefined;
    const from = ymdToLocalDate(value.dateDebut);
    const to =
      value.dateFin && value.dateFin !== value.dateDebut
        ? ymdToLocalDate(value.dateFin)
        : undefined;
    return { from, to };
  }, [value.dateDebut, value.dateFin]);

  const isSelectingEnd = !!selectedRange?.from && !selectedRange?.to;

  const previewRange = React.useMemo(() => {
    if (!isSelectingEnd || !hoveredDate || !selectedRange?.from) return null;
    const from = selectedRange.from;
    if (isSameDay(hoveredDate, from)) return null;
    const [start, end] =
      hoveredDate > from
        ? [addDays(from, 1), hoveredDate]
        : [hoveredDate, addDays(from, -1)];
    return { start, end };
  }, [isSelectingEnd, hoveredDate, selectedRange?.from]);

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
    if (isSelectingEnd && selectedRange?.from) {
      matchers.push({
        after: addDays(selectedRange.from, maxRangeDays),
      });
    }
    return matchers;
  }, [effectiveMin, isSelectingEnd, selectedRange, maxRangeDays]);

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
    if (
      selectedRange?.from &&
      !selectedRange.to &&
      !range.to &&
      isSameDay(range.from, selectedRange.from)
    ) {
      onChange({ dateDebut: null, dateFin: null });
      setHoveredDate(null);
      return;
    }
    const dateDebut = localDateToYmd(range.from);
    const dateFin = range.to ? localDateToYmd(range.to) : dateDebut;
    onChange({ dateDebut, dateFin });
    if (range.to) {
      const validation = isDateRangeValid({ dateDebut, dateFin });
      if (validation.ok) {
        setHoveredDate(null);
        setOpen(false);
      }
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
            onDayMouseEnter={(date) => setHoveredDate(date)}
            onDayMouseLeave={() => setHoveredDate(null)}
            defaultMonth={selectedRange?.from ?? effectiveMin}
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

"use client";

import * as React from "react";
import { CalendarIcon, ChevronDownIcon, AlertCircle } from "lucide-react";
import { fr as frLocale } from "react-day-picker/locale";
import { fr } from "date-fns/locale";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";

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
  RDV_HOUR_MAX,
  RDV_HOUR_MIN,
  RDV_MINUTE_STEP,
  RDV_TIMEZONE,
} from "@/lib/validation/rdvDateSchema";

export interface DateTimePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  disabled?: boolean;
  error?: string;
  minDate?: Date;
  timezone?: string;
  label?: string;
  required?: boolean;
  id?: string;
  placeholder?: string;
}

const HOURS = Array.from(
  { length: RDV_HOUR_MAX - RDV_HOUR_MIN + 1 },
  (_, i) => RDV_HOUR_MIN + i,
);
const MINUTES = Array.from(
  { length: Math.floor(60 / RDV_MINUTE_STEP) },
  (_, i) => i * RDV_MINUTE_STEP,
);

function formatDisplay(date: Date, timezone: string): string {
  const day = formatInTimeZone(date, timezone, "EEEE d MMMM yyyy", {
    locale: fr,
  });
  const time = formatInTimeZone(date, timezone, "HH'h'mm", { locale: fr });
  return `${day} à ${time}`;
}

function sameZonedDay(a: Date, b: Date, timezone: string): boolean {
  return (
    formatInTimeZone(a, timezone, "yyyy-MM-dd") ===
    formatInTimeZone(b, timezone, "yyyy-MM-dd")
  );
}

function startOfZonedDay(date: Date, timezone: string): Date {
  const y = Number(formatInTimeZone(date, timezone, "yyyy"));
  const m = Number(formatInTimeZone(date, timezone, "MM"));
  const d = Number(formatInTimeZone(date, timezone, "dd"));
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function buildDateFromParts(
  day: Date,
  hour: number,
  minute: number,
  timezone: string,
): Date {
  const year = day.getFullYear();
  const month = day.getMonth() + 1;
  const date = day.getDate();
  const ymd = `${year}-${String(month).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return fromZonedTime(`${ymd}T${hh}:${mm}:00`, timezone);
}

export function DateTimePicker({
  value,
  onChange,
  disabled = false,
  error,
  minDate,
  timezone = RDV_TIMEZONE,
  label,
  required = false,
  id,
  placeholder = "Sélectionnez la date et l'heure",
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const effectiveMin = React.useMemo(() => minDate ?? new Date(), [minDate]);
  const minZonedStart = React.useMemo(
    () => startOfZonedDay(effectiveMin, timezone),
    [effectiveMin, timezone],
  );

  const selectedDay = value ? toZonedTime(value, timezone) : undefined;
  const selectedHour = value
    ? Number(formatInTimeZone(value, timezone, "H"))
    : RDV_HOUR_MIN;
  const selectedMinute = value
    ? Number(formatInTimeZone(value, timezone, "m"))
    : 0;

  const triggerId = id ?? "datetime-picker-trigger";
  const labelId = `${triggerId}-label`;
  const errorId = `${triggerId}-error`;

  const handleDaySelect = (day: Date | undefined) => {
    if (!day) {
      onChange(null);
      return;
    }
    const hour = value ? selectedHour : RDV_HOUR_MIN;
    const minute = value ? selectedMinute : 0;
    const next = buildDateFromParts(day, hour, minute, timezone);
    onChange(next);
  };

  const handleHourChange = (hour: number) => {
    const baseDay = selectedDay ?? effectiveMin;
    const minute = selectedMinute;
    const next = buildDateFromParts(baseDay, hour, minute, timezone);
    onChange(next);
  };

  const handleMinuteChange = (minute: number) => {
    const baseDay = selectedDay ?? effectiveMin;
    const hour = selectedHour;
    const next = buildDateFromParts(baseDay, hour, minute, timezone);
    onChange(next);
  };

  const isToday = selectedDay
    ? sameZonedDay(selectedDay, effectiveMin, timezone)
    : false;

  const nowHour = Number(formatInTimeZone(effectiveMin, timezone, "H"));
  const nowMinute = Number(formatInTimeZone(effectiveMin, timezone, "m"));

  const isHourDisabled = (hour: number): boolean => {
    if (!isToday) return false;
    return hour < nowHour;
  };

  const isMinuteDisabled = (minute: number): boolean => {
    if (!isToday) return false;
    if (selectedHour > nowHour) return false;
    if (selectedHour < nowHour) return true;
    return minute <= nowMinute;
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
              !value && "text-muted-foreground",
              error && "border-destructive focus-visible:ring-destructive",
            )}
          >
            <span className="flex items-center gap-2">
              <CalendarIcon className="size-4" />
              {value ? formatDisplay(value, timezone) : placeholder}
            </span>
            <ChevronDownIcon className="size-4 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="flex flex-col sm:flex-row">
            <Calendar
              mode="single"
              selected={selectedDay}
              onSelect={handleDaySelect}
              defaultMonth={selectedDay ?? effectiveMin}
              disabled={{ before: minZonedStart }}
              locale={frLocale}
              weekStartsOn={1}
            />
            <div className="flex flex-col gap-3 border-t sm:border-t-0 sm:border-l border-border p-3 min-w-[10rem]">
              <div className="flex flex-col gap-1">
                <Label
                  htmlFor={`${triggerId}-hour`}
                  className="text-xs text-muted-foreground"
                >
                  Heure
                </Label>
                <select
                  id={`${triggerId}-hour`}
                  aria-label="Heure"
                  value={selectedHour}
                  onChange={(e) => handleHourChange(Number(e.target.value))}
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                >
                  {HOURS.map((h) => (
                    <option
                      key={h}
                      value={h}
                      disabled={isHourDisabled(h)}
                    >
                      {String(h).padStart(2, "0")}h
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <Label
                  htmlFor={`${triggerId}-minute`}
                  className="text-xs text-muted-foreground"
                >
                  Minutes
                </Label>
                <select
                  id={`${triggerId}-minute`}
                  aria-label="Minutes"
                  value={selectedMinute}
                  onChange={(e) => handleMinuteChange(Number(e.target.value))}
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                >
                  {MINUTES.map((m) => (
                    <option
                      key={m}
                      value={m}
                      disabled={isMinuteDisabled(m)}
                    >
                      {String(m).padStart(2, "0")}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => setOpen(false)}
                disabled={!value}
                className="mt-auto"
              >
                Valider
              </Button>
            </div>
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

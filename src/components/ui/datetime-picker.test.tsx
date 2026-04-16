import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { DateTimePicker } from "./datetime-picker";

describe("DateTimePicker", () => {
  it("affiche le placeholder quand value=null", () => {
    render(<DateTimePicker value={null} onChange={() => {}} />);
    const trigger = screen.getByRole("button");
    expect(trigger.textContent).toMatch(/sélectionnez la date/i);
  });

  it("affiche la date au format français quand une value est fournie", () => {
    const value = new Date("2026-04-23T14:30:00+02:00");
    render(<DateTimePicker value={value} onChange={() => {}} />);
    const trigger = screen.getByRole("button");
    expect(trigger.textContent).toMatch(/jeudi/i);
    expect(trigger.textContent).toMatch(/23 avril 2026/);
    expect(trigger.textContent).toMatch(/14h30/);
  });

  it("affiche un message d'erreur quand la prop error est fournie", () => {
    render(
      <DateTimePicker
        value={null}
        onChange={() => {}}
        error="Date requise"
      />,
    );
    expect(screen.getByRole("alert").textContent).toMatch(/Date requise/);
  });

  it("ouvre le popover et déclenche onChange lors du changement d'heure", () => {
    const handleChange = vi.fn();
    const value = new Date("2026-04-23T10:00:00+02:00");
    render(<DateTimePicker value={value} onChange={handleChange} />);
    fireEvent.click(screen.getByRole("button", { name: /23 avril 2026/i }));
    const hourSelect = screen.getByLabelText("Heure") as HTMLSelectElement;
    fireEvent.change(hourSelect, { target: { value: "11" } });
    expect(handleChange).toHaveBeenCalledTimes(1);
    const next = handleChange.mock.calls[0][0] as Date;
    expect(next).toBeInstanceOf(Date);
    expect(next.getTime()).not.toBe(value.getTime());
  });

  it("désactive les heures passées quand la date sélectionnée est aujourd'hui", () => {
    // Use a real-time "now" and select the same day at an hour equal to min.
    const now = new Date();
    const picker = new Date(now);
    picker.setHours(15, 0, 0, 0);
    render(
      <DateTimePicker
        value={picker}
        onChange={() => {}}
        minDate={new Date(now.getTime())}
      />,
    );
    fireEvent.click(screen.getByRole("button"));
    const hourSelect = screen.getByLabelText("Heure") as HTMLSelectElement;
    // Any hour strictly less than current hour (system TZ ~ Brussels for test)
    // should be disabled. We don't assert exact value to stay TZ-agnostic,
    // but at minimum one disabled option should exist when now > 08:00.
    const disabled = Array.from(hourSelect.options).filter((o) => o.disabled);
    if (now.getHours() > 8) {
      expect(disabled.length).toBeGreaterThan(0);
    } else {
      expect(disabled.length).toBe(0);
    }
  });
});

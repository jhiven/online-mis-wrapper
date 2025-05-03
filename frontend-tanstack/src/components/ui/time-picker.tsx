import * as React from "react";
import { TimePickerInput } from "./time-picker-input";

type TimePickerProps = {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
};

export function TimePicker({ date, onDateChange }: TimePickerProps) {
  const minuteRef = React.useRef<HTMLInputElement>(null);
  const hourRef = React.useRef<HTMLInputElement>(null);
  const secondRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-2">
      <TimePickerInput
        picker="hours"
        date={date}
        setDate={onDateChange}
        ref={hourRef}
        onRightFocus={() => minuteRef.current?.focus()}
      />
      <p className="text-lg font-medium">:</p>
      <TimePickerInput
        picker="minutes"
        date={date}
        setDate={onDateChange}
        ref={minuteRef}
        onLeftFocus={() => hourRef.current?.focus()}
        onRightFocus={() => secondRef.current?.focus()}
      />
    </div>
  );
}

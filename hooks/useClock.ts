import { useEffect, useState } from "react";
import { getClockParts } from "@/lib/timezone";

export function useClock(timezone?: string | null) {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  const [day, setDay] = useState("");

  useEffect(() => {
    const update = () => {
      const parts = getClockParts(timezone);
      setTime(parts.time);
      setDate(parts.date);
      setDay(parts.day);
    };

    update();
    const interval = setInterval(update, 1000);

    return () => clearInterval(interval);
  }, [timezone]);

  return { time, date, day };
}
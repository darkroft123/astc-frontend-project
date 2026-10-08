"use client";
import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Globe, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { COMMON_TIMEZONES, getTimezoneLabel } from "@/lib/timezones";

interface TimezoneSelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function TimezoneSelector({
  value,
  onChange,
  placeholder = "Seleccionar zona horaria...",
  className,
}: TimezoneSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search || search.trim().length === 0) return COMMON_TIMEZONES;
    const q = search.toLowerCase().trim();
    return COMMON_TIMEZONES.filter(
      (tz) =>
        tz.label.toLowerCase().includes(q) ||
        tz.value.toLowerCase().includes(q) ||
        tz.country.toLowerCase().includes(q)
    );
  }, [search]);

  const selectedLabel = getTimezoneLabel(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-10 w-full justify-between border rounded-lg px-3 text-sm font-normal bg-background",
            !value && "text-zinc-400",
            className
          )}
        >
          <span className="flex items-center gap-2 truncate">
            <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
            {selectedLabel || placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-zinc-400 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="h-4 w-4 shrink-0 text-zinc-400 mr-2" />
            <CommandInput
              placeholder="Buscar por pais, ciudad o zona horaria..."
              value={search}
              onValueChange={setSearch}
              className="h-10 border-0 outline-none focus:ring-0 text-sm flex-1"
            />
          </div>
          <CommandList>
            <CommandEmpty>No se encontró ninguna zona horaria.</CommandEmpty>
            <CommandGroup>
              {filtered.map((tz) => (
                <CommandItem
                  key={tz.value}
                  value={tz.value}
                  onSelect={(currentValue) => {
                    onChange(currentValue);
                    setSearch("");
                    setOpen(false);
                  }}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0",
                      value === tz.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="flex-1 text-sm">
                    {tz.label}{" "}
                    <span className="text-zinc-400 text-xs">
                      ({tz.value})
                    </span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}


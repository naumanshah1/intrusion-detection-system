import React, { useState, useRef, useEffect } from "react";
import { cn } from "../../lib/utils";

function Select({ value, onValueChange, children }) {
  const [open, setOpen] = useState(false);
  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  );
}

const SelectContext = React.createContext({});

function SelectTrigger({ className, children, ...props }) {
  const { open, setOpen, value } = React.useContext(SelectContext);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.closest(".select-root")?.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [setOpen]);

  return (
    <div className="select-root" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring",
          className
        )}
        {...props}
      >
        {children}
        <svg className="ml-2 h-3 w-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  );
}

function SelectValue({ placeholder }) {
  const { value } = React.useContext(SelectContext);
  return <span className="truncate">{value || placeholder}</span>;
}

function SelectContent({ children, className }) {
  const { open } = React.useContext(SelectContext);
  if (!open) return null;
  return (
    <div className={cn(
      "absolute z-50 top-full mt-1 w-full min-w-[120px] rounded-md border border-border bg-popover p-1 shadow-xl animate-in fade-in-0 zoom-in-95",
      className
    )}>
      {children}
    </div>
  );
}

function SelectItem({ value: itemValue, children, className }) {
  const { value, onValueChange, setOpen } = React.useContext(SelectContext);
  const isActive = value === itemValue;
  return (
    <button
      type="button"
      onClick={() => { onValueChange(itemValue); setOpen(false); }}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
        isActive && "bg-accent text-accent-foreground",
        className
      )}
    >
      {children}
    </button>
  );
}

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };

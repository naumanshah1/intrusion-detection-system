import React, { useState, useRef, useEffect } from "react";
import { cn } from "../../lib/utils";

const DropdownMenuContext = React.createContext({});

function DropdownMenu({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">{children}</div>
    </DropdownMenuContext.Provider>
  );
}

function DropdownMenuTrigger({ asChild, children, ...props }) {
  const { open, setOpen } = React.useContext(DropdownMenuContext);
  const handleClick = () => setOpen(!open);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, { onClick: handleClick, ...props });
  }
  return <button onClick={handleClick} {...props}>{children}</button>;
}

function DropdownMenuContent({ align = "start", className, children }) {
  const { open, setOpen } = React.useContext(DropdownMenuContext);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      setTimeout(() => document.addEventListener("mousedown", handleClick), 0);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, setOpen]);

  if (!open) return null;
  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-50 mt-1 min-w-[8rem] rounded-md border border-border bg-popover p-1 shadow-xl",
        align === "end" ? "right-0" : "left-0",
        className
      )}
    >
      {children}
    </div>
  );
}

function DropdownMenuItem({ asChild, className, children, onClick, ...props }) {
  const { setOpen } = React.useContext(DropdownMenuContext);
  const handleClick = (e) => {
    onClick?.(e);
    setOpen(false);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      className: cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground w-full",
        className, children.props.className
      ),
      onClick: handleClick,
      ...props,
    });
  }

  return (
    <button
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground w-full text-left",
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}

function DropdownMenuSeparator({ className }) {
  return <div className={cn("-mx-1 my-1 h-px bg-border", className)} />;
}

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator };

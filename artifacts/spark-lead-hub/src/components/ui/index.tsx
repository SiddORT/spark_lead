import React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'outline' | 'ghost' | 'destructive', size?: 'default' | 'sm' | 'lg' | 'icon' }>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const variants = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 hover:neon-glow-sm",
      outline: "border-2 border-border hover:border-primary hover:text-primary bg-transparent",
      ghost: "hover:bg-accent/10 hover:text-accent text-muted-foreground",
      destructive: "bg-destructive/10 text-destructive hover:bg-destructive hover:text-white border border-destructive/20 hover:shadow-lg hover:shadow-destructive/20"
    };
    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-8 rounded-md px-3 text-xs",
      lg: "h-12 rounded-lg px-8",
      icon: "h-10 w-10"
    };
    return (
      <button ref={ref} className={cn("inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50", variants[variant], sizes[size], className)} {...props} />
    )
  }
);

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => {
  return (
    <input ref={ref} className={cn("flex h-10 w-full rounded-md border border-border bg-card/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-colors", className)} {...props} />
  )
});

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => {
  return (
    <textarea ref={ref} className={cn("flex min-h-[80px] w-full rounded-md border border-border bg-card/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-colors", className)} {...props} />
  )
});

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...props }, ref) => {
  return (
    <select ref={ref} className={cn("flex h-10 w-full rounded-md border border-border bg-card/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-colors appearance-none", className)} {...props} />
  )
});

export const Card = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("rounded-xl border border-border bg-card text-card-foreground shadow-lg glass", className)} {...props} />
);

export const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
);

export const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn("font-display font-semibold leading-none tracking-tight", className)} {...props} />
);

export const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("p-6 pt-0", className)} {...props} />
);

export const Badge = ({ className, variant = "default", ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "outline" | "secondary" }) => {
  const variants = {
    default: "bg-primary text-primary-foreground shadow",
    outline: "text-foreground border border-border",
    secondary: "bg-accent/20 text-accent border border-accent/20"
  };
  return <div className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", variants[variant], className)} {...props} />;
};

export const Table = ({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
  <div className="relative w-full overflow-auto rounded-xl border border-border">
    <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
  </div>
);

export const TableHeader = ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={cn("[&_tr]:border-b border-border bg-muted/50", className)} {...props} />
);

export const TableBody = ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />
);

export const TableRow = ({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={cn("border-b border-border transition-colors hover:bg-muted/30 data-[state=selected]:bg-muted", className)} {...props} />
);

export const TableHead = ({ className, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
  <th className={cn("h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0", className)} {...props} />
);

export const TableCell = ({ className, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
  <td className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)} {...props} />
);

const TabsContext = React.createContext<{ active: string; setActive: (v: string) => void }>({ active: "", setActive: () => {} });

export const Tabs = ({ defaultValue, children, className, onValueChange }: { defaultValue: string, children: React.ReactNode, className?: string, onValueChange?: (v: string) => void }) => {
  const [active, setActiveState] = React.useState(defaultValue);
  const setActive = (val: string) => {
    setActiveState(val);
    onValueChange?.(val);
  };
  return <TabsContext.Provider value={{ active, setActive }}><div className={className}>{children}</div></TabsContext.Provider>;
};

export const TabsList = ({ className, children }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground", className)}>{children}</div>
);

export const TabsTrigger = ({ value, className, children, disabled }: React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string, disabled?: boolean }) => {
  const { active, setActive } = React.useContext(TabsContext);
  const isActive = active === value;
  return (
    <button disabled={disabled} onClick={() => setActive(value)} className={cn("inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50", isActive ? "bg-background text-foreground shadow-sm neon-glow-sm border border-primary/30" : "hover:text-foreground hover:bg-background/50", className)}>
      {children}
    </button>
  );
};

export const TabsContent = ({ value, className, children }: React.HTMLAttributes<HTMLDivElement> & { value: string }) => {
  const { active } = React.useContext(TabsContext);
  if (active !== value) return null;
  return <div className={cn("mt-4 animate-slide-in", className)}>{children}</div>;
};

export const Dialog = ({ open, onOpenChange, children }: { open: boolean, onOpenChange: (open: boolean) => void, children: React.ReactNode }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="relative z-50 w-full max-w-lg bg-card border border-border rounded-2xl glass-strong p-6 shadow-2xl animate-slide-in max-h-[90vh] overflow-y-auto">
        <button onClick={() => onOpenChange(false)} className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 hover:text-primary focus:outline-none"><X size={20} /></button>
        {children}
      </div>
    </div>
  );
};

export const Sheet = ({ open, onOpenChange, children, className }: { open: boolean, onOpenChange: (open: boolean) => void, children: React.ReactNode, className?: string }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity" onClick={() => onOpenChange(false)} />
      <div className={cn("relative z-50 w-full max-w-2xl bg-card border-l border-border glass-strong h-full shadow-2xl animate-slide-in overflow-hidden flex flex-col", className)}>
        <button onClick={() => onOpenChange(false)} className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 hover:text-primary focus:outline-none p-2 bg-background/50 backdrop-blur-md"><X size={20} /></button>
        {children}
      </div>
    </div>
  );
};

export const Switch = ({ checked, onCheckedChange, disabled }: { checked: boolean, onCheckedChange: (v: boolean) => void, disabled?: boolean }) => (
  <button type="button" disabled={disabled} role="switch" aria-checked={checked} onClick={() => onCheckedChange(!checked)} className={cn("peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", checked ? "bg-primary neon-glow-sm" : "bg-muted")}>
    <span className={cn("pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform", checked ? "translate-x-5" : "translate-x-0")} />
  </button>
);

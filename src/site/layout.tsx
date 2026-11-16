import * as React from "react";
import { NavLink, Outlet, ScrollRestoration, useLocation } from "react-router";
import { Moon, Sliders, Sun } from "react-feather";
import { cn } from "@/lib/ad";
import { serializeConfig } from "@/lib/config";
import { Button, buttonClass } from "@/components/ui/button";
import { Popover } from "@/components/ui/popover";
import { Toaster } from "@/components/ui/toast";
import { TooltipProvider, Tooltip } from "@/components/ui/tooltip";
import { ConfigTokens, SLink, useConfig } from "./config";
import { ALL_FIELDS, ConfigPanel, resetPatch } from "./config-panel";

export function Wordmark({ className }: { className?: string }) {
  return <span className={cn("whitespace-nowrap text-[15px] font-semibold tracking-[-0.01em] text-ink", className)}>Alora Design</span>;
}

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  const [config] = useConfig();
  const q = serializeConfig(config);
  return (
    <NavLink
      to={q ? `${to}?${q}` : to}
      className={({ isActive }) => cn(buttonClass({ variant: "ghost" }), "text-ink-muted hover:text-ink", isActive && "bg-fill text-ink")}
    >
      {children}
    </NavLink>
  );
}

export function CustomizeButton({ label = true }: { label?: boolean }) {
  const [config, setConfig] = useConfig();
  return (
    <Popover
      align="end"
      className="w-72 p-pad"
      trigger={
        <Button variant="secondary" icon={!label} aria-label="Customize">
          <Sliders />
          {label ? <span className="max-sm:hidden">Customize</span> : null}
        </Button>
      }
    >
      <ConfigPanel value={config} onChange={setConfig} onReset={() => setConfig(resetPatch(ALL_FIELDS))} />
    </Popover>
  );
}

export function ThemeButton() {
  const [config, setConfig] = useConfig();
  const dark = config.theme === "dark";
  return (
    <Tooltip content={dark ? "Light theme" : "Dark theme"}>
      <Button variant="ghost" icon aria-label={dark ? "Light theme" : "Dark theme"} onClick={() => setConfig({ theme: dark ? "light" : "dark" })}>
        {dark ? <Sun /> : <Moon />}
      </Button>
    </Tooltip>
  );
}

export function SiteHeader({ className }: { className?: string }) {
  return (
    <header className={cn("mx-auto flex h-16 w-full max-w-[1280px] items-center gap-1 px-4 sm:px-6", className)}>
      <SLink to="/" className="mr-3 rounded-control px-1 py-1 sm:mr-6">
        <Wordmark />
      </SLink>
      <nav className="flex items-center gap-1 max-sm:hidden">
        <NavItem to="/gallery">Gallery</NavItem>
        <NavItem to="/examples">Examples</NavItem>
        <NavItem to="/export">Export</NavItem>
      </nav>
      <div className="ml-auto flex items-center gap-1.5">
        <CustomizeButton />
        <ThemeButton />
      </div>
    </header>
  );
}

export function PhoneNav() {
  return (
    <nav className="mx-4 mb-2 flex gap-1 sm:hidden">
      <NavItem to="/gallery">Gallery</NavItem>
      <NavItem to="/examples">Examples</NavItem>
      <NavItem to="/export">Export</NavItem>
    </nav>
  );
}

export function SiteLayout() {
  const { pathname } = useLocation();
  const app = pathname.startsWith("/examples");
  return (
    <TooltipProvider>
      <ConfigTokens />
      <ScrollRestoration />
      <SiteHeader className={app ? "max-w-none sm:px-4" : undefined} />
      <PhoneNav />
      <Outlet />
      <Toaster />
    </TooltipProvider>
  );
}

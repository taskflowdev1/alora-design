import * as React from "react";
import { NavLink, Outlet, ScrollRestoration, useNavigate } from "react-router";
import { Box, Download, Grid, Home, Layout, Moon, Search as SearchIcon, Sliders, Sun } from "react-feather";
import { cn } from "@/lib/ad";
import { serializeConfig } from "@/lib/config";
import { Button, buttonClass } from "@/components/ui/button";
import { Popover } from "@/components/ui/popover";
import { Toaster } from "@/components/ui/toast";
import { CommandPalette, useCommandShortcut } from "@/components/ui/command-palette";
import { Shortcut } from "@/components/ui/kbd";
import { GROUPS, ITEMS } from "@/lib/registry";
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

function HeaderSearch() {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();
  const [config] = useConfig();
  const q = serializeConfig(config);
  const go = (path: string) => navigate(q ? `${path}?${q}` : path);
  useCommandShortcut(setOpen);
  const groups = React.useMemo(
    () => [
      {
        label: "Pages",
        items: [
          { id: "home", label: "Home", icon: Home, onSelect: () => go("/") },
          { id: "gallery", label: "Gallery", icon: Grid, onSelect: () => go("/gallery") },
          { id: "examples", label: "Examples", icon: Layout, onSelect: () => go("/examples/dashboard") },
          { id: "export", label: "Export", icon: Download, onSelect: () => go("/export") },
        ],
      },
      ...GROUPS.map((g) => ({
        label: g,
        items: ITEMS.filter((i) => i.group === g).map((i) => ({ id: i.name, label: i.title, keywords: i.name, icon: Box, onSelect: () => go(`/gallery/${i.name}`) })),
      })),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q],
  );
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search components"
        className={cn(buttonClass({ variant: "secondary" }), "w-control justify-center px-0 font-normal text-ink-muted sm:w-52 sm:justify-start sm:px-3")}
      >
        <SearchIcon />
        <span className="flex-1 text-left max-sm:hidden">Search</span>
        <Shortcut keys={["mod", "K"]} className="max-sm:hidden" />
      </button>
      <CommandPalette open={open} onOpenChange={setOpen} groups={groups} placeholder="Find a component or page" />
    </>
  );
}

/** One header for every page: same position, width and height on landing, gallery, examples and export. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-page/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center gap-1 px-4 sm:px-6">
        <SLink to="/" className="mr-3 rounded-control px-1 py-1 sm:mr-6">
          <Wordmark />
        </SLink>
        <nav className="flex items-center gap-1 max-md:hidden">
          <NavItem to="/gallery">Gallery</NavItem>
          <NavItem to="/examples">Examples</NavItem>
          <NavItem to="/export">Export</NavItem>
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          <HeaderSearch />
          <CustomizeButton />
          <ThemeButton />
        </div>
      </div>
      <nav className="mx-auto flex h-11 w-full max-w-[1280px] items-start gap-1 px-4 sm:px-6 md:hidden">
        <NavItem to="/gallery">Gallery</NavItem>
        <NavItem to="/examples">Examples</NavItem>
        <NavItem to="/export">Export</NavItem>
      </nav>
    </header>
  );
}

export function SiteLayout() {
  return (
    <TooltipProvider>
      <ConfigTokens />
      <ScrollRestoration />
      <SiteHeader />
      <Outlet />
      <Toaster />
    </TooltipProvider>
  );
}

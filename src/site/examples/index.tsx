import * as React from "react";
import { useNavigate, useParams } from "react-router";
import { Bell, ChevronDown, Home, LogOut, MoreHorizontal, Package, Plus, Settings as SettingsIcon, ShoppingBag, Tag, User, Users, XCircle } from "react-feather";
import { cn } from "@/lib/ad";
import { serializeConfig } from "@/lib/config";
import { Sidebar, SidebarItem, SidebarSection } from "@/components/ui/sidebar";
import { Menu, MenuItem } from "@/components/ui/menu";
import { Avatar } from "@/components/ui/avatar";
import { toast } from "@/components/ui/toast";
import { MobileTab, MobileTabBar } from "@/components/mobile/mobile-tab-bar";
import { NotificationBell } from "@/components/ui/notification-bell";
import { SLink, useConfig } from "../config";
import { useEdgeFade } from "../layout";
import { NOTICES, SHOPS } from "../data";
import { Cancellations } from "./cancellations";
import { Dashboard } from "./dashboard";
import { Orders } from "./orders";
import { Products } from "./products";
import { Promotions } from "./promotions";
import { Settings } from "./settings";
import { Team } from "./team";

type Page = "dashboard" | "orders" | "products" | "promotions" | "cancellations" | "team" | "settings";
const PAGES: Page[] = ["dashboard", "orders", "products", "promotions", "cancellations", "team", "settings"];

const NAV: { key: Page; label: string; icon: typeof Home; count?: number }[] = [
  { key: "dashboard", label: "Dashboard", icon: Home },
  { key: "orders", label: "Orders", icon: ShoppingBag, count: 23 },
  { key: "products", label: "Products", icon: Package },
  { key: "promotions", label: "Promotions", icon: Tag },
  { key: "cancellations", label: "Cancellations", icon: XCircle, count: 4 },
];

/** The phone layout's floating create action, above the tab bar. */
function Fab({ icon: Icon, label, onClick }: { icon: React.ComponentType<{ size?: number | string }>; label: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "fixed bottom-[calc(92px+env(safe-area-inset-bottom))] right-4 z-40 grid size-12 cursor-pointer place-items-center rounded-card bg-brand text-brand-ink shadow-dialog",
        "ad-press hover:bg-brand-hover focus-visible:bg-brand-hover active:scale-[0.97]",
      )}
    >
      <Icon size={20} />
    </button>
  );
}

/**
 * A sidebar link. SidebarItem asChild clones its child around the row and also prints its children as the label; the
 * label copy renders inside the outer link (InLink), so it comes out as plain text: one link, one Tab stop per item.
 */
const InLink = React.createContext(false);
function NavLink({ to, children, ...props }: { to: string; children: React.ReactNode } & Omit<React.ComponentProps<typeof SLink>, "to">) {
  if (React.useContext(InLink)) return <>{children}</>;
  return (
    <InLink.Provider value={true}>
      <SLink to={to} {...props}>
        {children}
      </SLink>
    </InLink.Provider>
  );
}

function AppSidebar({ page }: { page: Page }) {
  const [shop, setShop] = React.useState("All shops");
  const [notices, setNotices] = React.useState(NOTICES);
  return (
    <Sidebar className="h-full max-lg:hidden">
      <Menu
        tone="dark"
        trigger={
          <button type="button" className="mb-3 flex h-control w-full cursor-pointer items-center gap-2.5 rounded-item bg-side-fill px-2.5 text-left text-body text-side-ink ad-press hover:bg-side-fill-strong focus-visible:bg-side-fill-strong active:scale-[0.98]">
            <span className="min-w-0 flex-1 truncate font-medium">Rimba · {shop}</span>
            <ChevronDown size={16} className="shrink-0 text-side-muted" />
          </button>
        }
      >
        {["All shops", ...SHOPS].map((s) => (
          <MenuItem key={s} onSelect={() => setShop(s)}>
            {s}
          </MenuItem>
        ))}
      </Menu>
      <SidebarSection>
        {NAV.map((n) => (
          <SidebarItem key={n.key} icon={n.icon} active={page === n.key} count={n.count} asChild>
            <NavLink to={`/examples/${n.key}`}>{n.label}</NavLink>
          </SidebarItem>
        ))}
      </SidebarSection>
      <SidebarSection label="Shop">
        <SidebarItem icon={Users} active={page === "team"} asChild>
          <NavLink to="/examples/team">Team</NavLink>
        </SidebarItem>
        <SidebarItem icon={SettingsIcon} active={page === "settings"} asChild>
          <NavLink to="/examples/settings">Settings</NavLink>
        </SidebarItem>
      </SidebarSection>
      <div className="mt-auto flex items-center justify-between pl-1">
        <Menu
          tone="dark"
          side="top"
          trigger={
            // The avatar is already filled, so hover and keyboard focus darken it a notch (as the sliding pill does).
            <button type="button" aria-label="Account" className="cursor-pointer rounded-full transition-[filter] duration-[150ms] ease-ad hover:brightness-[0.9] focus-visible:brightness-[0.78]">
              <Avatar name="Rizky Hartono" size="sm" className="bg-side-fill-strong text-side-ink" />
            </button>
          }
        >
          <MenuItem icon={User}>Profile</MenuItem>
          <MenuItem icon={Bell}>Notifications</MenuItem>
          <MenuItem icon={LogOut}>Sign out</MenuItem>
        </Menu>
        <div className="ad-on-dark">
          <NotificationBell notices={notices} onMarkAllRead={() => setNotices(notices.map((n) => ({ ...n, unread: false })))} className="text-side-muted hover:text-side-ink" />
        </div>
      </div>
    </Sidebar>
  );
}

function PhoneNavBar({ page }: { page: Page }) {
  const navigate = useNavigate();
  const [config] = useConfig();
  const q = serializeConfig(config);
  const go = (p: Page) => navigate(`/examples/${p}${q ? `?${q}` : ""}`);
  const more: Page[] = ["promotions", "cancellations", "team", "settings"];
  return (
    <div className="lg:hidden">
      <MobileTabBar>
        <SLink to="/examples/dashboard" className="flex flex-1">
          <MobileTab icon={Home} label="Home" active={page === "dashboard"} />
        </SLink>
        <SLink to="/examples/orders" className="flex flex-1">
          <MobileTab icon={ShoppingBag} label="Orders" active={page === "orders"} />
        </SLink>
        <SLink to="/examples/products" className="flex flex-1">
          <MobileTab icon={Package} label="Products" active={page === "products"} />
        </SLink>
        <Menu side="top" align="end" trigger={<span className="flex flex-1"><MobileTab icon={MoreHorizontal} label="More" active={more.includes(page)} /></span>}>
          <MenuItem icon={Tag} onSelect={() => go("promotions")}>Promotions</MenuItem>
          <MenuItem icon={XCircle} onSelect={() => go("cancellations")}>Cancellations</MenuItem>
          <MenuItem icon={Users} onSelect={() => go("team")}>Team</MenuItem>
          <MenuItem icon={SettingsIcon} onSelect={() => go("settings")}>Settings</MenuItem>
        </Menu>
      </MobileTabBar>
      {page === "orders" ? <Fab icon={Plus} label="Add order" onClick={() => toast("New order")} /> : null}
    </div>
  );
}

export function Examples() {
  const { page = "dashboard" } = useParams();
  const p = (PAGES.includes(page as Page) ? page : "dashboard") as Page;
  const app = React.useRef<HTMLDivElement>(null);
  useEdgeFade(app);
  React.useLayoutEffect(() => {
    if (app.current) app.current.scrollTop = 0;
  }, [p]);
  return (
    <div className="mx-auto flex h-[calc(100dvh-64px)] w-full max-w-[1280px] gap-3 px-4 pb-4 sm:px-6 max-lg:h-auto max-lg:min-h-[calc(100dvh-108px)]">
      <AppSidebar page={p} />
      <div ref={app} data-app className="ad-fade-y min-w-0 flex-1 overflow-auto rounded-card max-lg:pb-24">
        {/* key: a fresh page (its own state and scroll) per switch; it swaps in one frame, no fade from blank. */}
        <div key={p} className="px-0 py-1 sm:px-4 sm:py-2">
          {p === "dashboard" ? (
            <Dashboard />
          ) : p === "orders" ? (
            <Orders />
          ) : p === "products" ? (
            <Products />
          ) : p === "promotions" ? (
            <Promotions />
          ) : p === "cancellations" ? (
            <Cancellations />
          ) : p === "team" ? (
            <Team />
          ) : (
            <Settings />
          )}
        </div>
      </div>
      <PhoneNavBar page={p} />
    </div>
  );
}

import * as React from "react";
import { useNavigate, useParams } from "react-router";
import { Bell, Home, LogOut, MoreHorizontal, Package, Settings as SettingsIcon, ShoppingBag, Tag, User, Users, XCircle } from "react-feather";
import { cn } from "@/lib/ad";
import { serializeConfig } from "@/lib/config";
import { Sidebar, SidebarItem, SidebarSection } from "@/components/ui/sidebar";
import { Menu, MenuItem } from "@/components/ui/menu";
import { Avatar } from "@/components/ui/avatar";
import { MobileTab, MobileTabBar } from "@/components/mobile/mobile-tab-bar";
import { NotificationBell } from "@/components/ui/notification-bell";
import { AppFrame } from "../app-frame";
import { SLink, useConfig } from "../config";
import { useEdgeFade } from "../layout";
import { NOTICES } from "../data";
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

type Notices = { notices: typeof NOTICES; onRead: () => void };

/** The shop's mark: its initial on a soft square. */
const ShopMark = ({ className }: { className?: string }) => (
  <span aria-hidden className={cn("grid size-7 shrink-0 place-items-center rounded-item text-body font-semibold", className)}>
    R
  </span>
);

const accountItems = (
  <>
    <MenuItem icon={User}>Profile</MenuItem>
    <MenuItem icon={Bell}>Notifications</MenuItem>
    <MenuItem icon={LogOut}>Sign out</MenuItem>
  </>
);

/** Phone chrome: the shop on the left, notifications and the profile on the right. Sections live in the bottom nav. */
function PhoneAppBar({ notices, onRead }: Notices) {
  return (
    <div data-phone-app-bar className="flex h-touch items-center gap-2 lg:hidden">
      <ShopMark className="bg-fill-strong text-ink" />
      <span translate="no" className="mr-auto truncate text-title font-semibold text-ink">
        Rimba
      </span>
      <NotificationBell notices={notices} onMarkAllRead={onRead} className="size-touch" />
      <Menu
        align="end"
        trigger={
          <button type="button" aria-label="Account" className="grid size-touch cursor-pointer place-items-center rounded-full transition-[filter] duration-[150ms] ease-ad hover:brightness-[0.9] focus-visible:brightness-[0.78]">
            <Avatar name="Rizky Hartono" size="sm" />
          </button>
        }
      >
        {accountItems}
      </Menu>
    </div>
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

function AppSidebar({ page, notices, onRead }: { page: Page } & Notices) {
  return (
    <Sidebar className="h-full max-lg:hidden">
      <div className="mb-3 flex h-control items-center gap-2.5 px-1 text-body text-side-ink">
        <ShopMark className="bg-side-fill-strong text-side-ink" />
        <span translate="no" className="min-w-0 flex-1 truncate font-medium">
          Rimba
        </span>
      </div>
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
          {accountItems}
        </Menu>
        <div className="ad-on-dark">
          <NotificationBell notices={notices} onMarkAllRead={onRead} className="text-side-muted hover:text-side-ink" />
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
    </div>
  );
}

/** The height a full-height page (Orders) gets inside the frame: the window, less the header, the frame and its padding. */
const PAGE_HEIGHT = { "--ex-page-h": "calc(100dvh - 64px - 16px - var(--frame-inset) * 2 - var(--ad-pad) * 2)" } as React.CSSProperties;

export function Examples() {
  const { page = "dashboard" } = useParams();
  const p = (PAGES.includes(page as Page) ? page : "dashboard") as Page;
  const app = React.useRef<HTMLDivElement>(null);
  const [notices, setNotices] = React.useState(NOTICES);
  const bell = { notices, onRead: () => setNotices(notices.map((n) => ({ ...n, unread: false }))) };
  useEdgeFade(app);
  React.useLayoutEffect(() => {
    if (app.current) app.current.scrollTop = 0;
  }, [p]);
  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 pb-4 sm:px-6 lg:h-[calc(100dvh-64px)] max-lg:min-h-[calc(100dvh-108px)]">
      <AppFrame className="lg:h-full" sidebar={<AppSidebar page={p} {...bell} />}>
        <PhoneAppBar {...bell} />
        <div ref={app} data-app style={PAGE_HEIGHT} className="ad-fade-y min-h-0 min-w-0 flex-1 overflow-auto max-lg:pb-[calc(max(10px,env(safe-area-inset-bottom))+52px+2*var(--ad-nest)+12px+52px+16px)]">
          {/* key: a fresh page (its own state and scroll) per switch; it swaps in one frame, no fade from blank. */}
          <div key={p} className="px-0 py-1 lg:p-pad">
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
      </AppFrame>
      <PhoneNavBar page={p} />
    </div>
  );
}

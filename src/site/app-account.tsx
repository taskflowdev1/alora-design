// The example app's notifications and account, shown at the right end of the site's top bar on /examples pages: top
// right rather than at the foot of the sidebar, so they stay reachable on phones, where the sidebar is closed.
import * as React from "react";
import { Bell, LogOut, User } from "react-feather";
import { Avatar } from "@/components/ui/avatar";
import { Menu, MenuItem } from "@/components/ui/menu";
import { NotificationBell, type Notice } from "@/components/ui/notification-bell";

const NOTICES: Notice[] = [
  { id: "1", title: "2 shops haven't synced since 09:40", time: "Today, 10:10", unread: true },
  { id: "2", title: "Payout of Rp 12.840.000 sent", time: "Today, 08:02", unread: true },
  { id: "3", title: "Keranjang pandan besar is out of stock", time: "Yesterday, 19:45" },
];

export function AppAccount() {
  const [notices, setNotices] = React.useState(NOTICES);
  return (
    <>
      <NotificationBell notices={notices} onMarkAllRead={() => setNotices(notices.map((n) => ({ ...n, unread: false })))} />
      <Menu
        align="end"
        trigger={
          <button type="button" aria-label="Account" className="grid size-control cursor-pointer place-items-center rounded-full transition-transform duration-[160ms] active:scale-95">
            <Avatar name="Rizky Hartono" size="sm" />
          </button>
        }
      >
        <MenuItem icon={User}>Profile</MenuItem>
        <MenuItem icon={Bell}>Notifications</MenuItem>
        <MenuItem icon={LogOut}>Sign out</MenuItem>
      </Menu>
    </>
  );
}

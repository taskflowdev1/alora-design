// The phone bottom sheet moved to the Mobile set: src/components/mobile/mobile-sheet.tsx (install name mobile-sheet),
// now with detents. These names stay so existing imports and `drawer` installs keep working. Desktop uses Sheet or Dialog.
export { MobileSheet as Drawer, MobileSheetClose as DrawerClose, type MobileSheetProps as DrawerProps } from "../mobile/mobile-sheet";

import { createBrowserRouter, Navigate, useLocation, useParams } from "react-router";
import { Inbox } from "react-feather";
import { EmptyState } from "@/components/ui/empty-state";
import { SiteLayout } from "./layout";
import { Landing } from "./landing";
import { GalleryIndex, GalleryItem } from "./gallery";
import { CollectionIndex, CollectionItem } from "./collections";
import { Examples } from "./examples";
import { ExportPage } from "./export";
import { MobileAppPage } from "./mobile-app-page";
import { MobileScreensPage } from "./mobile-screens-page";

function ToDashboard() {
  const { search } = useLocation();
  return <Navigate to={`/examples/dashboard${search}`} replace />;
}

/** /gallery was the Components page before v4; old links keep working. */
function FromGallery() {
  const { name } = useParams();
  const { search } = useLocation();
  return <Navigate to={`/components${name ? `/${name}` : ""}${search}`} replace />;
}

/** The 404: the empty-state look, but its title is the page's h1. The header above is the way on. */
function NotFound() {
  return (
    <main className="flex flex-col items-center justify-center gap-3 px-4 py-32 text-center">
      <Inbox size={40} style={{ strokeWidth: 1.5 }} className="text-ink-muted" />
      <h1 className="text-heading font-semibold text-ink">Nothing here</h1>
    </main>
  );
}

export const router = createBrowserRouter([
  // The example phone app, full screen on a phone (no site header).
  { path: "/mobile/app", element: <MobileAppPage />, errorElement: <EmptyState icon={Inbox} title="Something broke on this page" className="py-32" /> },
  { path: "/mobile/app/:screen", element: <MobileAppPage />, errorElement: <EmptyState icon={Inbox} title="Something broke on this page" className="py-32" /> },
  {
    element: <SiteLayout />,
    errorElement: <EmptyState icon={Inbox} title="Something broke on this page" className="py-32" />,
    children: [
      { path: "/", element: <Landing /> },
      { path: "/components", element: <GalleryIndex /> },
      { path: "/components/:name", element: <GalleryItem /> },
      { path: "/mobile", element: <GalleryIndex /> },
      { path: "/mobile/screens", element: <MobileScreensPage /> },
      { path: "/mobile/:name", element: <GalleryItem /> },
      { path: "/ai", element: <CollectionIndex section="ai" /> },
      { path: "/ai/:name", element: <CollectionItem section="ai" /> },
      { path: "/backgrounds", element: <CollectionIndex section="backgrounds" /> },
      { path: "/backgrounds/:name", element: <CollectionItem section="backgrounds" /> },
      { path: "/gallery", element: <FromGallery /> },
      { path: "/gallery/:name", element: <FromGallery /> },
      { path: "/examples", element: <ToDashboard /> },
      { path: "/examples/:page", element: <Examples /> },
      { path: "/encyclopedia", lazy: async () => ({ Component: (await import("./encyclopedia")).EncyclopediaPage }) },
      { path: "/export", element: <ExportPage /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

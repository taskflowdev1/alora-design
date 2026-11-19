import { createBrowserRouter, Navigate, useLocation, useParams } from "react-router";
import { Inbox } from "react-feather";
import { EmptyState } from "@/components/ui/empty-state";
import { SiteLayout } from "./layout";
import { Landing } from "./landing";
import { GalleryIndex, GalleryItem } from "./gallery";
import { CollectionIndex, CollectionItem } from "./collections";
import { Examples } from "./examples";
import { ExportPage } from "./export";

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

function NotFound() {
  return <EmptyState icon={Inbox} title="Nothing here" className="py-32" />;
}

export const router = createBrowserRouter([
  {
    element: <SiteLayout />,
    errorElement: <EmptyState icon={Inbox} title="Something broke on this page" className="py-32" />,
    children: [
      { path: "/", element: <Landing /> },
      { path: "/components", element: <GalleryIndex /> },
      { path: "/components/:name", element: <GalleryItem /> },
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

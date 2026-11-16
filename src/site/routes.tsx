import { createBrowserRouter, Navigate, useLocation } from "react-router";
import { Inbox } from "react-feather";
import { EmptyState } from "@/components/ui/empty-state";
import { SiteLayout } from "./layout";
import { Landing } from "./landing";
import { GalleryIndex, GalleryItem } from "./gallery";
import { Examples } from "./examples";
import { ExportPage } from "./export";

function ToDashboard() {
  const { search } = useLocation();
  return <Navigate to={`/examples/dashboard${search}`} replace />;
}

function NotFound() {
  return <EmptyState icon={Inbox} title="Nothing here" className="py-32" />;
}

export const router = createBrowserRouter([
  {
    element: <SiteLayout />,
    children: [
      { path: "/", element: <Landing /> },
      { path: "/gallery", element: <GalleryIndex /> },
      { path: "/gallery/:name", element: <GalleryItem /> },
      { path: "/examples", element: <ToDashboard /> },
      { path: "/examples/:page", element: <Examples /> },
      { path: "/export", element: <ExportPage /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

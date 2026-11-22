import type * as React from "react";

/** One component on the landing: a linked title over the component, centred at `width` (a max-w-* class). */
export interface ShowpieceMoment {
  /** data-moment id, unique on the page. */
  id: string;
  /** The component's name, shown as the moment's title. */
  title: string;
  /** Its page, e.g. "/components/slide-to-pay". */
  to: string;
  /** Tailwind max width for the component column, e.g. "max-w-[440px]". */
  width: string;
  /** A touch gesture (a slide, a swipe): shown on the landing only where the pointer is a finger. */
  touchOnly?: boolean;
  render: () => React.ReactNode;
}

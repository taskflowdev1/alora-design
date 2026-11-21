import { Box, Truck } from "react-feather";
import { cn } from "@/lib/ad";
import { Card, CardHeader } from "@/components/ui/card";
import { MarketMark } from "@/components/ui/marketplace-mark";
import { CopyChip } from "@/components/ui/copy-chip";
import { Steps } from "@/components/ui/steps";
import { Timeline } from "@/components/ui/timeline";
import { TEAM } from "../data";

/** One order on its way: the tracking number to copy, the step it's at, and what happened so far. */
export function ShipmentCard({ className }: { className?: string }) {
  return (
    <Card className={cn("grid min-w-0 content-start gap-4", className)}>
      <CardHeader title="RMB-24815" action={<CopyChip value="JNE 0123 4567 8910">JNE 0123 4567 8910</CopyChip>} />
      <Steps steps={["Paid", "Packed", "Shipped", "Delivered"]} current={2} />
      <Timeline
        className="-mx-2"
        events={[
          { id: "1", time: "Today, 14:05", title: "Picked up by JNE", media: <Truck /> },
          { id: "2", time: "Today, 11:40", title: `Packed by ${TEAM[3].name}`, media: <Box /> },
          { id: "3", time: "Yesterday, 21:30", title: "Ordered on Shopee", media: <MarketMark market="shopee" /> },
        ]}
      />
    </Card>
  );
}

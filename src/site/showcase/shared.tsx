import { toast } from "@/components/ui/toast";

export const say = (m: string) => () => toast(m, "neutral");

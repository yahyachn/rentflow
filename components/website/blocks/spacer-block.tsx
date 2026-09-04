import type { SpacerBlock } from "@/validators/website-blocks";

const HEIGHT_CLASS: Record<SpacerBlock["height"], string> = {
  none: "h-0",
  sm: "h-4",
  md: "h-10",
  lg: "h-20",
  xl: "h-32",
};

export function SpacerBlockView({ block }: { block: SpacerBlock }) {
  return <div aria-hidden className={HEIGHT_CLASS[block.height]} />;
}

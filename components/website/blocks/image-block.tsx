import Image from "next/image";

import type { Locale } from "@/i18n/config";
import type { ImageBlock } from "@/validators/website-blocks";
import { pickText } from "@/components/website/locale-text";
import { Reveal } from "@/components/marketing/reveal";

export function ImageBlockView({ block, locale }: { block: ImageBlock; locale: Locale }) {
  if (!block.imageUrl) return null;
  const alt = pickText(block.alt, locale);
  const caption = pickText(block.caption, locale);

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 lg:px-6">
      <Reveal>
        <figure className="overflow-hidden rounded-3xl">
          <Image
            src={block.imageUrl}
            alt={alt || "Website image"}
            width={1600}
            height={900}
            className="w-full object-cover"
          />
          {caption && (
            <figcaption className="text-muted-foreground mt-3 text-center text-sm">{caption}</figcaption>
          )}
        </figure>
      </Reveal>
    </section>
  );
}

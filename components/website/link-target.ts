import { whatsappLink } from "@/lib/utils";
import type { LinkTarget } from "@/validators/website-blocks";

export type LinkAgencyContact = {
  whatsapp?: string | null;
  phone?: string | null;
  email?: string | null;
};

/** Resolve a builder-configured link into a concrete href. Closed set by
 * design (see validators/website-blocks.ts#linkTargetSchema) — there is no
 * "raw URL" field, so a directeur can never inject `javascript:` or an
 * arbitrary attribute here. */
export function resolveLink(link: LinkTarget, agency: LinkAgencyContact): string | null {
  switch (link.kind) {
    case "none":
      return null;
    case "page":
      return link.slug ? `/${link.slug}` : "/";
    case "vehicles":
      return "/vehicles";
    case "vehicle":
      return `/vehicles/${link.slug}`;
    case "category":
      return `/vehicles?category=${encodeURIComponent(link.slug)}`;
    case "contact":
      return "/contact";
    case "anchor":
      return `#${link.id}`;
    case "external":
      return link.url;
    case "whatsapp":
      return whatsappLink(agency.whatsapp);
    case "phone":
      return agency.phone ? `tel:${agency.phone}` : null;
    case "email":
      return agency.email ? `mailto:${agency.email}` : null;
  }
}

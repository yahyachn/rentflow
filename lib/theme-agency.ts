import type { CSSProperties } from "react";

/**
 * Turn an agency's brand colors (Agency.primaryColor / accentColor — plain
 * hex, editable from the dashboard's Website > Theme tab) into inline CSS
 * custom properties that override the `.marketing-shell` defaults from
 * app/globals.css for that one agency's site. Invalid/missing values fall
 * back to undefined, i.e. the shared RentFlow default palette — an agency
 * that never touches its theme sees exactly the same colors as before this
 * feature existed.
 */
const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export function agencyThemeStyle(agency: {
  primaryColor?: string | null;
  accentColor?: string | null;
}): CSSProperties {
  const style: Record<string, string> = {};
  if (agency.primaryColor && HEX_RE.test(agency.primaryColor)) {
    style["--primary"] = agency.primaryColor;
  }
  if (agency.accentColor && HEX_RE.test(agency.accentColor)) {
    style["--accent"] = agency.accentColor;
  }
  return style as CSSProperties;
}

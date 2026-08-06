import React from "react";
import { MERKATO_LOGO_BASE64 } from "../assets/merkato_logo_base64";

export const DEFAULT_ONLINE_LOGO = MERKATO_LOGO_BASE64;

export const LOGO_OPTIONS = [
  {
    id: "merkato_store_logo",
    name: "Merkato Store Emblem",
    badge: "Official Merkato Store Logo",
    description: "Official Merkato Store emblem image.",
    src: MERKATO_LOGO_BASE64
  }
];

export function getActiveLogoPath() {
  return MERKATO_LOGO_BASE64;
}

export default function LogoSelectorModal() {
  return null;
}

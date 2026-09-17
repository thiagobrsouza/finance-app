"use client";

import { useState } from "react";

interface InstitutionLogoProps {
  name: string;
  domain?: string | null;
  iconUrl?: string | null;
  size?: number;
}

/** Ícone da instituição via logo por domínio (ver docs/02-modelagem-dados.md); cai para iniciais se falhar. */
export function InstitutionLogo({ name, domain, iconUrl, size = 32 }: InstitutionLogoProps) {
  const src = iconUrl ?? (domain ? `https://logo.clearbit.com/${domain}` : null);
  const [failed, setFailed] = useState(!src);

  if (failed || !src) {
    const initials = name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
    return (
      <div
        className="rounded-md bg-primary-light text-primary flex items-center justify-center font-semibold flex-shrink-0"
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {initials}
      </div>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      className="rounded-md object-contain flex-shrink-0 bg-white"
      onError={() => setFailed(true)}
    />
  );
}

/** Shared branding and trademark strings for UI attribution. */

export const PROJECT_NAME = "The Buselligence Project";
export const PRODUCT_NAME = "Buselligence by Salestrics";
export const TRADEMARK_OWNER = "Salestrics Inc.";

export function copyrightYear(): number {
  return new Date().getFullYear();
}

export const TRADEMARK_SHORT =
  "Buselligence™ and The Buselligence Project™ are trademarks of Salestrics Inc.";

export const TRADEMARK_FOOTER = `© ${copyrightYear()} ${TRADEMARK_OWNER} ${TRADEMARK_SHORT}`;

export const TRADEMARK_NOTICE =
  "Source code is open source under the MIT License. Use of the Buselligence name, logos, or official branding is not granted by the software license and requires permission from Salestrics Inc.";

export const FORK_NOTICE =
  "Forks and derivatives should use their own branding and may not represent themselves as the official Buselligence Project unless authorized by Salestrics Inc.";

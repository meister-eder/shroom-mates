type AddressLike = {
  first_name?: string | null;
  last_name?: string | null;
  company?: string | null;
  address_1?: string | null;
  address_2?: string | null;
  postal_code?: string | null;
  city?: string | null;
  country_code?: string | null;
};

/** Address as display lines: name, company, street, postcode + city, country. */
export function formatAddressLines(addr?: AddressLike | null): string[] {
  if (!addr) return [];
  const name = [addr.first_name, addr.last_name].filter(Boolean).join(" ");
  const place = [addr.postal_code, addr.city].filter(Boolean).join(" ");
  return [
    name,
    addr.company,
    addr.address_1,
    addr.address_2,
    place,
    addr.country_code?.toUpperCase(),
  ].filter((line): line is string => !!line);
}

export function isSameAddress(
  a?: AddressLike | null,
  b?: AddressLike | null,
): boolean {
  if (!a || !b) return false;
  return (
    a.first_name === b.first_name &&
    a.last_name === b.last_name &&
    a.address_1 === b.address_1 &&
    a.postal_code === b.postal_code &&
    a.city === b.city &&
    a.country_code === b.country_code
  );
}

import type { FieldErrors, Path, UseFormRegister } from "react-hook-form";

export interface RegionCountry {
  iso_2: string;
  display_name?: string;
  name?: string;
}

export interface AddressValues {
  firstName: string;
  lastName: string;
  address: string;
  company: string;
  postalCode: string;
  city: string;
  country: string;
  province: string;
}

// Shared form shape — defined here so AddressFields can type `register` correctly
// without creating a circular dependency with ShippingAddressStep
export interface CheckoutFormValues {
  email: string;
  phone: string;
  billingSameAsShipping: boolean;
  shipping: AddressValues;
  billing: AddressValues;
}

const INPUT_BASE = "input-field";
const ERROR = "input-error";
const SPACER = "";

interface AddressFieldsProps {
  prefix: "shipping" | "billing";
  register: UseFormRegister<CheckoutFormValues>;
  errors: FieldErrors<AddressValues>;
  countries: RegionCountry[];
}

export const AddressFields = ({
  prefix,
  register,
  errors,
  countries,
}: AddressFieldsProps) => {
  const f = (name: keyof AddressValues) =>
    `${prefix}.${name}` as Path<CheckoutFormValues>;

  return (
    <div className="space-y-4">
      {/* Row 1: First name / Last name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <input
            type="text"
            placeholder="Vorname*"
            {...register(f("firstName"))}
            className={`${INPUT_BASE}${errors.firstName ? " error" : ""}`}
          />
          <p className={ERROR}>{errors.firstName?.message ?? ""}</p>
        </div>
        <div>
          <input
            type="text"
            placeholder="Nachname*"
            {...register(f("lastName"))}
            className={`${INPUT_BASE}${errors.lastName ? " error" : ""}`}
          />
          <p className={ERROR}>{errors.lastName?.message ?? ""}</p>
        </div>
      </div>

      {/* Row 2: Address / Company */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <input
            type="text"
            placeholder="Adresse*"
            {...register(f("address"))}
            className={`${INPUT_BASE}${errors.address ? " error" : ""}`}
          />
          <p className={ERROR}>{errors.address?.message ?? ""}</p>
        </div>
        <div>
          <input
            type="text"
            placeholder="Firma"
            {...register(f("company"))}
            className={INPUT_BASE}
          />
          <p className={SPACER} />
        </div>
      </div>

      {/* Row 3: Postal code / City */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <input
            type="text"
            placeholder="PLZ*"
            {...register(f("postalCode"))}
            className={`${INPUT_BASE}${errors.postalCode ? " error" : ""}`}
          />
          <p className={ERROR}>{errors.postalCode?.message ?? ""}</p>
        </div>
        <div>
          <input
            type="text"
            placeholder="Stadt*"
            {...register(f("city"))}
            className={`${INPUT_BASE}${errors.city ? " error" : ""}`}
          />
          <p className={ERROR}>{errors.city?.message ?? ""}</p>
        </div>
      </div>

      {/* Row 4: Country / State */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <select
            {...register(f("country"))}
            className={`${INPUT_BASE}${errors.country ? " error" : ""}`}
          >
            <option disabled value="">
              Land
            </option>
            {countries.map((c) => (
              <option key={c.iso_2} value={c.iso_2}>
                {c.display_name ?? c.name}
              </option>
            ))}
          </select>
          <p className={ERROR}>{errors.country?.message ?? ""}</p>
        </div>
        <div>
          <input
            type="text"
            placeholder="Bundesland"
            {...register(f("province"))}
            className={INPUT_BASE}
          />
          <p className={SPACER} />
        </div>
      </div>
    </div>
  );
};

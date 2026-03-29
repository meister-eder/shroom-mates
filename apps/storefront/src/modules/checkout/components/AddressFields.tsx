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
          <label className="input-label" htmlFor={`${prefix}-firstName`}>Vorname *</label>
          <input
            id={`${prefix}-firstName`}
            type="text"
            autoComplete="given-name"
            {...register(f("firstName"))}
            className={`${INPUT_BASE}${errors.firstName ? " error" : ""}`}
          />
          {errors.firstName && <p className={ERROR}>{errors.firstName.message}</p>}
        </div>
        <div>
          <label className="input-label" htmlFor={`${prefix}-lastName`}>Nachname *</label>
          <input
            id={`${prefix}-lastName`}
            type="text"
            autoComplete="family-name"
            {...register(f("lastName"))}
            className={`${INPUT_BASE}${errors.lastName ? " error" : ""}`}
          />
          {errors.lastName && <p className={ERROR}>{errors.lastName.message}</p>}
        </div>
      </div>

      {/* Row 2: Address / Company */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="input-label" htmlFor={`${prefix}-address`}>Straße und Hausnummer *</label>
          <input
            id={`${prefix}-address`}
            type="text"
            autoComplete="street-address"
            {...register(f("address"))}
            className={`${INPUT_BASE}${errors.address ? " error" : ""}`}
          />
          {errors.address && <p className={ERROR}>{errors.address.message}</p>}
        </div>
        <div>
          <label className="input-label" htmlFor={`${prefix}-company`}>Firma <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
          <input
            id={`${prefix}-company`}
            type="text"
            autoComplete="organization"
            {...register(f("company"))}
            className={INPUT_BASE}
          />
        </div>
      </div>

      {/* Row 3: Postal code / City */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="input-label" htmlFor={`${prefix}-postalCode`}>PLZ *</label>
          <input
            id={`${prefix}-postalCode`}
            type="text"
            autoComplete="postal-code"
            {...register(f("postalCode"))}
            className={`${INPUT_BASE}${errors.postalCode ? " error" : ""}`}
          />
          {errors.postalCode && <p className={ERROR}>{errors.postalCode.message}</p>}
        </div>
        <div>
          <label className="input-label" htmlFor={`${prefix}-city`}>Stadt *</label>
          <input
            id={`${prefix}-city`}
            type="text"
            autoComplete="address-level2"
            {...register(f("city"))}
            className={`${INPUT_BASE}${errors.city ? " error" : ""}`}
          />
          {errors.city && <p className={ERROR}>{errors.city.message}</p>}
        </div>
      </div>

      {/* Row 4: Country / State */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="input-label" htmlFor={`${prefix}-country`}>Land *</label>
          <select
            id={`${prefix}-country`}
            autoComplete="country"
            {...register(f("country"))}
            className={`${INPUT_BASE}${errors.country ? " error" : ""}`}
          >
            <option disabled value="">Land auswählen</option>
            {countries.map((c) => (
              <option key={c.iso_2} value={c.iso_2}>
                {c.display_name ?? c.name}
              </option>
            ))}
          </select>
          {errors.country && <p className={ERROR}>{errors.country.message}</p>}
        </div>
        <div>
          <label className="input-label" htmlFor={`${prefix}-province`}>Bundesland <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
          <input
            id={`${prefix}-province`}
            type="text"
            autoComplete="address-level1"
            {...register(f("province"))}
            className={INPUT_BASE}
          />
        </div>
      </div>
    </div>
  );
};

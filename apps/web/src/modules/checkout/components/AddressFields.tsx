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

export const ERROR_CLASS = "input-error field__error checkout-error";
const ERROR = ERROR_CLASS;

/** Feld wie im Mockup: fette Label, 2px Tinte, eckig, Creme, 14px Innenabstand. */
export const FIELD = "field field--checkout";

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
    <div className="shop-stack">
      {/* Row 1: First name / Last name */}
      <div className="form-grid form-grid--2">
        <div className={FIELD}>
          <label htmlFor={`${prefix}-firstName`}>Vorname *</label>
          <input
            id={`${prefix}-firstName`}
            type="text"
            autoComplete="given-name"
            {...register(f("firstName"))}
            aria-invalid={errors.firstName ? true : undefined}
            aria-describedby={
              errors.firstName ? `${prefix}-firstName-error` : undefined
            }
          />
          {errors.firstName && (
            <p className={ERROR} id={`${prefix}-firstName-error`}>
              {errors.firstName.message}
            </p>
          )}
        </div>
        <div className={FIELD}>
          <label htmlFor={`${prefix}-lastName`}>Nachname *</label>
          <input
            id={`${prefix}-lastName`}
            type="text"
            autoComplete="family-name"
            {...register(f("lastName"))}
            aria-invalid={errors.lastName ? true : undefined}
            aria-describedby={
              errors.lastName ? `${prefix}-lastName-error` : undefined
            }
          />
          {errors.lastName && (
            <p className={ERROR} id={`${prefix}-lastName-error`}>
              {errors.lastName.message}
            </p>
          )}
        </div>
      </div>

      {/* Row 2: Address */}
      <div className="form-grid">
        <div className={FIELD}>
          <label htmlFor={`${prefix}-address`}>Straße und Hausnummer *</label>
          <input
            id={`${prefix}-address`}
            type="text"
            autoComplete="street-address"
            {...register(f("address"))}
            aria-invalid={errors.address ? true : undefined}
            aria-describedby={
              errors.address ? `${prefix}-address-error` : undefined
            }
          />
          {errors.address && (
            <p className={ERROR} id={`${prefix}-address-error`}>
              {errors.address.message}
            </p>
          )}
        </div>
      </div>

      {/* Row 3: Postal code / City */}
      <div className="form-grid form-grid--2">
        <div className={FIELD}>
          <label htmlFor={`${prefix}-postalCode`}>PLZ *</label>
          <input
            id={`${prefix}-postalCode`}
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            {...register(f("postalCode"))}
            aria-invalid={errors.postalCode ? true : undefined}
            aria-describedby={
              errors.postalCode ? `${prefix}-postalCode-error` : undefined
            }
          />
          {errors.postalCode && (
            <p className={ERROR} id={`${prefix}-postalCode-error`}>
              {errors.postalCode.message}
            </p>
          )}
        </div>
        <div className={FIELD}>
          <label htmlFor={`${prefix}-city`}>Stadt *</label>
          <input
            id={`${prefix}-city`}
            type="text"
            autoComplete="address-level2"
            {...register(f("city"))}
            aria-invalid={errors.city ? true : undefined}
            aria-describedby={errors.city ? `${prefix}-city-error` : undefined}
          />
          {errors.city && (
            <p className={ERROR} id={`${prefix}-city-error`}>
              {errors.city.message}
            </p>
          )}
        </div>
      </div>

      {/* Row 4: Country / State */}
      <div className="form-grid form-grid--2">
        <div className={FIELD}>
          <label htmlFor={`${prefix}-country`}>Land *</label>
          <select
            id={`${prefix}-country`}
            autoComplete="country"
            {...register(f("country"))}
            aria-invalid={errors.country ? true : undefined}
            aria-describedby={
              errors.country ? `${prefix}-country-error` : undefined
            }
          >
            <option disabled value="">
              Land auswählen
            </option>
            {countries.map((c) => (
              <option key={c.iso_2} value={c.iso_2}>
                {c.display_name ?? c.name}
              </option>
            ))}
          </select>
          {errors.country && (
            <p className={ERROR} id={`${prefix}-country-error`}>
              {errors.country.message}
            </p>
          )}
        </div>
        <div className={FIELD}>
          <label htmlFor={`${prefix}-province`}>
            Bundesland <span className="field-note">(optional)</span>
          </label>
          <input
            id={`${prefix}-province`}
            type="text"
            autoComplete="address-level1"
            {...register(f("province"))}
          />
        </div>
      </div>

      {/* Row 5: Company */}
      <div className="form-grid">
        <div className={FIELD}>
          <label htmlFor={`${prefix}-company`}>
            Firma <span className="field-note">(optional)</span>
          </label>
          <input
            id={`${prefix}-company`}
            type="text"
            autoComplete="organization"
            {...register(f("company"))}
          />
        </div>
      </div>
    </div>
  );
};

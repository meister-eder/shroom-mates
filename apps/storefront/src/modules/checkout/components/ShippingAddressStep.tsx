import { zodResolver } from "@hookform/resolvers/zod";
import { updateCartAddress } from "@lib/stores/cart";
import type { StoreCart } from "@medusajs/types";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  AddressFields,
  type AddressValues,
  type CheckoutFormValues,
  type RegionCountry,
} from "./AddressFields";

const addressSchema = z.object({
  firstName: z.string().min(1, "Vorname ist erforderlich"),
  lastName: z.string().min(1, "Nachname ist erforderlich"),
  address: z.string().min(1, "Adresse ist erforderlich"),
  company: z.string(),
  postalCode: z.string().min(1, "PLZ ist erforderlich"),
  city: z.string().min(1, "Stadt ist erforderlich"),
  country: z.string().min(1, "Land ist erforderlich"),
  province: z.string(),
});

// Billing fields are bare strings — validated conditionally via superRefine
const billingSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  address: z.string(),
  company: z.string(),
  postalCode: z.string(),
  city: z.string(),
  country: z.string(),
  province: z.string(),
});

const formSchema = z
  .object({
    email: z
      .string()
      .min(1, "E-Mail ist erforderlich")
      .refine(
        (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
        "Bitte gib eine gültige E-Mail-Adresse ein",
      ),
    phone: z.string(),
    billingSameAsShipping: z.boolean(),
    shipping: addressSchema,
    billing: billingSchema,
  })
  .superRefine(({ billingSameAsShipping, billing }, ctx) => {
    if (billingSameAsShipping) return;

    const required: [keyof typeof billing, string][] = [
      ["firstName", "Vorname ist erforderlich"],
      ["lastName", "Nachname ist erforderlich"],
      ["address", "Adresse ist erforderlich"],
      ["postalCode", "PLZ ist erforderlich"],
      ["city", "Stadt ist erforderlich"],
      ["country", "Land ist erforderlich"],
    ];

    for (const [field, message] of required) {
      if (!billing[field].trim()) {
        ctx.addIssue({ code: "custom", path: ["billing", field], message });
      }
    }
  });

const EMPTY_ADDRESS: AddressValues = {
  firstName: "",
  lastName: "",
  address: "",
  company: "",
  postalCode: "",
  city: "",
  country: "",
  province: "",
};

function mapAddress(
  addr?: StoreCart["shipping_address"] | null,
): AddressValues {
  return {
    firstName: addr?.first_name ?? "",
    lastName: addr?.last_name ?? "",
    address: addr?.address_1 ?? "",
    company: addr?.company ?? "",
    postalCode: addr?.postal_code ?? "",
    city: addr?.city ?? "",
    country: addr?.country_code ?? "",
    province: addr?.province ?? "",
  };
}

function areSameAddress(
  a?: StoreCart["shipping_address"] | null,
  b?: StoreCart["billing_address"] | null,
): boolean {
  if (!a || !b) return false;
  return (
    a.first_name === b.first_name &&
    a.last_name === b.last_name &&
    a.address_1 === b.address_1 &&
    a.postal_code === b.postal_code &&
    a.city === b.city
  );
}

interface ShippingAddressStepProps {
  cart: StoreCart | null;
  countries: RegionCountry[];
  countryCode: string;
  mode: "edit" | "read";
  onContinue?: () => void;
  onEdit?: () => void;
}

const CheckCircle = () => (
  <span className="inline-flex items-center justify-center w-5 h-5 bg-black rounded-full shrink-0">
    <svg
      className="w-3 h-3 text-white"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2 6l3 3 5-5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </span>
);

const ReadOnlyView = ({
  cart,
  onEdit,
}: {
  cart: StoreCart;
  onEdit?: () => void;
}) => {
  const shipping = cart.shipping_address;
  const billing = cart.billing_address;
  const isBillingSame = areSameAddress(shipping, billing);

  const shippingLines = [
    shipping?.first_name && shipping?.last_name
      ? `${shipping.first_name} ${shipping.last_name}`
      : null,
    shipping?.address_1 ?? null,
    shipping?.postal_code && shipping?.city
      ? `${shipping.postal_code}, ${shipping.city}`
      : null,
    shipping?.country_code?.toUpperCase() ?? null,
  ].filter(Boolean) as string[];

  const billingLines = isBillingSame
    ? null
    : [
      billing?.first_name && billing?.last_name
        ? `${billing.first_name} ${billing.last_name}`
        : null,
      billing?.address_1 ?? null,
      billing?.postal_code && billing?.city
        ? `${billing.postal_code}, ${billing.city}`
        : null,
      billing?.country_code?.toUpperCase() ?? null,
    ].filter(Boolean) as string[];

  return (
    <div className="checkout-step">
      <div className="checkout-step-header">
        <div className="checkout-step-number done">1</div>
        <h2 style={{ fontFamily: '"DM Mono", monospace', fontWeight: 700, fontSize: "1.1rem" }}>
          Lieferadresse
        </h2>
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0" style={{ background: "#000", marginLeft: "0.25rem" }}>
          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" aria-hidden="true" style={{ color: "#fff" }}>
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <button
          type="button"
          onClick={onEdit}
          className="ml-auto text-sm hover:underline"
          style={{ color: "var(--accent, #ff4908)" }}
        >
          Bearbeiten
        </button>
      </div>

      <div className="checkout-step-body">
        <div className="grid grid-cols-3 gap-8 text-sm">
          <div>
            <p className="input-label mb-1">Lieferadresse</p>
            {shippingLines.map((line, i) => (
              <p key={i} style={{ color: "var(--text-muted)" }}>
                {line}
              </p>
            ))}
          </div>

          <div>
            <p className="input-label mb-1">Kontakt</p>
            {cart.email && <p style={{ color: "var(--text-muted)" }}>{cart.email}</p>}
          </div>

          <div>
            <p className="input-label mb-1">Rechnungsadresse</p>
            {isBillingSame ? (
              <p style={{ color: "var(--text-muted)" }}>
                Rechnungs- und Lieferadresse sind identisch.
              </p>
            ) : (
              billingLines?.map((line, i) => (
                <p key={i} style={{ color: "var(--text-muted)" }}>
                  {line}
                </p>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ShippingAddressStep = ({
  cart,
  countries,
  countryCode,
  mode,
  onContinue,
  onEdit,
}: ShippingAddressStepProps) => {
  const [submitError, setSubmitError] = useState("");
  const cartInitialized = useRef(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      phone: "",
      billingSameAsShipping: true,
      shipping: { ...EMPTY_ADDRESS, country: countryCode },
      billing: { ...EMPTY_ADDRESS },
    },
  });

  // Populate form from saved cart address on first load / after refresh
  useEffect(() => {
    if (!cart || cartInitialized.current) return;
    cartInitialized.current = true;

    const shipping = cart.shipping_address;
    if (!shipping?.first_name) return; // No saved address yet, keep empty defaults

    const billing = cart.billing_address;
    const billingSame =
      !billing?.first_name || areSameAddress(shipping, billing);

    reset({
      email: cart.email ?? "",
      phone: shipping.phone ?? "",
      billingSameAsShipping: billingSame,
      shipping: mapAddress(shipping),
      billing: billingSame ? mapAddress(shipping) : mapAddress(billing),
    });
  }, [cart, reset]);

  const billingSameAsShipping = watch("billingSameAsShipping");

  const onSubmit = async (data: CheckoutFormValues) => {
    setSubmitError("");
    try {
      const shippingAddress = {
        first_name: data.shipping.firstName,
        last_name: data.shipping.lastName,
        address_1: data.shipping.address,
        company: data.shipping.company || undefined,
        postal_code: data.shipping.postalCode,
        city: data.shipping.city,
        country_code: data.shipping.country,
        province: data.shipping.province || undefined,
        phone: data.phone || undefined,
      };

      await updateCartAddress({
        email: data.email,
        shipping_address: shippingAddress,
        billing_address: data.billingSameAsShipping
          ? shippingAddress
          : {
            first_name: data.billing.firstName,
            last_name: data.billing.lastName,
            address_1: data.billing.address,
            company: data.billing.company || undefined,
            postal_code: data.billing.postalCode,
            city: data.billing.city,
            country_code: data.billing.country,
            province: data.billing.province || undefined,
          },
      });

      onContinue?.();
    } catch (error) {
      console.error("Failed to update shipping address:", error);
      setSubmitError("Adresse konnte nicht gespeichert werden. Bitte versuche es erneut.");
    }
  };

  if (mode === "read" && cart) {
    return <ReadOnlyView cart={cart} onEdit={onEdit} />;
  }

  return (
    <div className="checkout-step">
      <div className="checkout-step-header">
        <div className="checkout-step-number active">1</div>
        <h2 style={{ fontFamily: '"DM Mono", monospace', fontWeight: 700, fontSize: "1.1rem" }}>
          Lieferadresse
        </h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="checkout-step-body">
        <div className="space-y-4">
          <AddressFields
            prefix="shipping"
            register={register}
            errors={errors.shipping ?? {}}
            countries={countries}
          />

          {/* Billing same as shipping */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              {...register("billingSameAsShipping")}
              className="w-4 h-4 accent-black"
            />
            <span className="text-sm">Rechnungsadresse entspricht der Lieferadresse</span>
          </label>

          {/* Email / Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <input
                type="email"
                placeholder="E-Mail*"
                {...register("email")}
                className={`input-field${errors.email ? " error" : ""}`}
              />
              <p className="input-error">
                {errors.email?.message ?? ""}
              </p>
            </div>
            <div>
              <input
                type="tel"
                placeholder="Telefon"
                {...register("phone")}
                className="input-field"
              />
            </div>
          </div>

          {/* Billing address section */}
          {!billingSameAsShipping && (
            <div className="pt-4" style={{ borderTop: "2px solid var(--border-subtle)" }}>
              <h3 className="input-label mb-4" style={{ fontSize: "1rem" }}>Rechnungsadresse</h3>
              <AddressFields
                prefix="billing"
                register={register}
                errors={errors.billing ?? {}}
                countries={countries}
              />
            </div>
          )}

          {submitError && (
            <p className="input-error">{submitError}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="text-white py-3 px-8 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: "var(--accent, #ff4908)",
              border: "2px solid #000",
              fontFamily: '"DM Mono", monospace',
            }}
          >
            {isSubmitting ? "Wird gespeichert..." : "Weiter zur Lieferung"}
          </button>
        </div>
      </form>
    </div>
  );
};

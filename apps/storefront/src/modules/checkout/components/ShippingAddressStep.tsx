import { zodResolver } from "@hookform/resolvers/zod";
import { updateCartAddress } from "@lib/stores/cart";
import { formatAddressLines, isSameAddress } from "@lib/utils/address";
import type { StoreCart } from "@medusajs/types";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  AddressFields,
  type AddressValues,
  type CheckoutFormValues,
  ERROR_CLASS,
  FIELD,
  type RegionCountry,
} from "./AddressFields";
import { CheckoutStep } from "./CheckoutStep";

// Format checks shared by shipping and (when separate) billing address.
type AddressIssue = { field: keyof AddressValues; message: string };
function addressFormatIssues(a: AddressValues): AddressIssue[] {
  const issues: AddressIssue[] = [];
  if (a.address.trim() && !/\d/.test(a.address)) {
    issues.push({
      field: "address",
      message: "Bitte gib auch die Hausnummer an",
    });
  }
  if (
    a.country === "de" &&
    a.postalCode.trim() &&
    !/^\d{5}$/.test(a.postalCode.trim())
  ) {
    issues.push({
      field: "postalCode",
      message: "Bitte gib eine gültige fünfstellige PLZ ein",
    });
  }
  return issues;
}

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
    phone: z
      .string()
      .refine(
        (val) => !val.trim() || /^\+?[\d\s()/-]{6,}$/.test(val.trim()),
        "Bitte gib eine gültige Telefonnummer ein",
      ),
    billingSameAsShipping: z.boolean(),
    shipping: addressSchema,
    billing: billingSchema,
  })
  .superRefine(({ billingSameAsShipping, shipping, billing }, ctx) => {
    for (const { field, message } of addressFormatIssues(shipping)) {
      ctx.addIssue({ code: "custom", path: ["shipping", field], message });
    }

    if (billingSameAsShipping) return;

    for (const { field, message } of addressFormatIssues(billing)) {
      ctx.addIssue({ code: "custom", path: ["billing", field], message });
    }

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

interface ShippingAddressStepProps {
  cart: StoreCart | null;
  countries: RegionCountry[];
  countryCode: string;
  mode: "edit" | "read";
  onContinue?: () => void;
  onEdit?: () => void;
}

const ReadOnlyView = ({
  cart,
  onEdit,
}: {
  cart: StoreCart;
  onEdit?: () => void;
}) => {
  const isBillingSame = isSameAddress(
    cart.shipping_address,
    cart.billing_address,
  );
  const summary = [...formatAddressLines(cart.shipping_address), cart.email]
    .filter(Boolean)
    .join(" · ");

  return (
    <CheckoutStep number={1} title="Adresse" state="done" onEdit={onEdit}>
      <p className="m-0">{summary}</p>
      {!isBillingSame && (
        <p className="m-0 mt-1 text-[15px]">
          Rechnungsadresse:{" "}
          {formatAddressLines(cart.billing_address).join(" · ")}
        </p>
      )}
    </CheckoutStep>
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
      !billing?.first_name || isSameAddress(shipping, billing);

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
      setSubmitError(
        "Adresse konnte nicht gespeichert werden. Bitte versuche es erneut.",
      );
    }
  };

  if (mode === "read" && cart) {
    return <ReadOnlyView cart={cart} onEdit={onEdit} />;
  }

  return (
    <CheckoutStep number={1} title="Adresse" state="active">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-4">
          <AddressFields
            prefix="shipping"
            register={register}
            errors={errors.shipping ?? {}}
            countries={countries}
          />

          {/* Email / Phone */}
          <div className="grid grid-cols-1 gap-4">
            <div className={FIELD}>
              <label htmlFor="checkout-email">
                E-Mail *{" "}
                <span className="text-sm font-normal">
                  für die Bestellbestätigung
                </span>
              </label>
              {/* biome-ignore lint/correctness/useUniqueElementIds: feste ID für label/aria-Verknüpfung, Komponente wird pro Seite nur einmal gerendert */}
              <input
                id="checkout-email"
                type="email"
                autoComplete="email"
                {...register("email")}
                aria-invalid={errors.email ? true : undefined}
              />
              {errors.email && (
                <p className={ERROR_CLASS}>{errors.email.message}</p>
              )}
            </div>
            <div className={`${FIELD} sm:max-w-[calc(50%-8px)]`}>
              <label htmlFor="checkout-phone">
                Telefon <span className="font-normal text-sm">(optional)</span>
              </label>
              {/* biome-ignore lint/correctness/useUniqueElementIds: feste ID für label/aria-Verknüpfung, Komponente wird pro Seite nur einmal gerendert */}
              <input
                id="checkout-phone"
                type="tel"
                autoComplete="tel"
                {...register("phone")}
                aria-invalid={errors.phone ? true : undefined}
              />
              {errors.phone && (
                <p className={ERROR_CLASS}>{errors.phone.message}</p>
              )}
            </div>
          </div>

          {/* Billing same as shipping */}
          <label className="flex cursor-pointer select-none items-center gap-2.5 text-base">
            <input
              type="checkbox"
              {...register("billingSameAsShipping")}
              className="h-[22px] w-[22px] shrink-0 accent-ink"
            />
            <span>Rechnungsadresse entspricht der Lieferadresse</span>
          </label>

          {/* Billing address section */}
          {!billingSameAsShipping && (
            <div className="border-t-2 border-ink pt-5">
              <h3 className="mb-4 text-xl! font-black!">Rechnungsadresse</h3>
              <AddressFields
                prefix="billing"
                register={register}
                errors={errors.billing ?? {}}
                countries={countries}
              />
            </div>
          )}

          {submitError && (
            <p className={ERROR_CLASS} role="alert">
              {submitError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn--primary btn--block min-h-[58px] text-lg"
          >
            {isSubmitting ? "Wird gespeichert..." : "Weiter zur Lieferung"}
          </button>
        </div>
      </form>
    </CheckoutStep>
  );
};

import { flyToCart } from "@lib/fly-to-cart";
import { sdk } from "@lib/sdk";
import { addToCart } from "@lib/stores/cart";
import { showErrorToast } from "@lib/stores/toast";
import { basePriceLabel } from "@lib/utils/base-price";
import {
  getPricesForVariant,
  getProductPrice,
} from "@lib/utils/get-product-price";
import { isProductInStock } from "@lib/utils/is-product-in-stock";
import { QtyStepper } from "@modules/common/components/QtyStepper";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ProductVariant } from "../../../../types/global";

type Variant = {
  id: string;
  title?: string | null;
  sku?: string | null;
  options:
    | {
        id: string;
        option_id?: string | null;
      }[]
    | null;
  manage_inventory: boolean | null;
  allow_backorder: boolean | null;
  inventory_quantity?: number | null;
  calculated_price?: ProductVariant["calculated_price"];
};

interface Props {
  options: {
    id: string;
    title: string;
    values?: {
      id: string;
      value: string;
    }[];
  }[];
  variants: Variant[];
  productId: string;
  productTitle: string;
  regionId: string;
}

const MAX_QTY = 10;
/** From this stock level on the page says "Nur noch N Stück da" */
const LOW_STOCK = 5;

export const ProductActions = ({
  options,
  variants: initialVariants,
  productId,
  productTitle,
  regionId,
}: Props) => {
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >(() => {
    const initial: Record<string, string> = {};
    for (const option of options) {
      if (option.values?.length) {
        initial[option.id] = option.values[0].id;
      }
    }
    return initial;
  });
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [variants, setVariants] = useState<Variant[]>(initialVariants);
  const [isLoadingVariants, setIsLoadingVariants] = useState(true);
  const addedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const addButton = useRef<HTMLButtonElement>(null);

  useEffect(() => () => clearTimeout(addedTimer.current), []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: läuft bewusst nur bei den genannten Abhängigkeiten
  useEffect(() => {
    let cancelled = false;

    async function fetchFreshVariants() {
      try {
        const { product } = await sdk.store.product.retrieve(productId, {
          region_id: regionId,
          fields:
            "+variants.inventory_quantity,*variants.options,*variants.calculated_price",
        });

        if (!cancelled && product?.variants) {
          const fresh = product.variants as Variant[];
          // keep the server-rendered price if the fresh response has none
          setVariants(
            fresh.map((v) => ({
              ...v,
              calculated_price:
                v.calculated_price ??
                initialVariants.find((i) => i.id === v.id)?.calculated_price,
            })),
          );
        }
      } catch (error) {
        console.error("Failed to fetch fresh variant data:", error);
      } finally {
        if (!cancelled) {
          setIsLoadingVariants(false);
        }
      }
    }

    fetchFreshVariants();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, regionId]);

  const selectedVariant = useMemo(() => {
    if (
      !variants.length ||
      !options.length ||
      Object.keys(selectedOptions).length !== options.length
    ) {
      return;
    }

    return variants.find((variant) =>
      variant.options?.every(
        (optionValue) =>
          optionValue.id === selectedOptions[optionValue.option_id!],
      ),
    );
  }, [selectedOptions, variants, options]);

  const inStock = selectedVariant ? isProductInStock(selectedVariant) : false;

  // Price of the selected variant (cheapest as fallback), Grundpreis (§ 4 PAngV)
  const price = useMemo(() => {
    const asVariants = variants as unknown as ProductVariant[];
    return (
      (selectedVariant
        ? getPricesForVariant(selectedVariant as unknown as ProductVariant)
        : null) ??
      getProductPrice({ productVariants: asVariants }).cheapestPrice
    );
  }, [selectedVariant, variants]);
  const basePrice = price
    ? basePriceLabel(
        price.calculated_price_number,
        price.currency_code,
        price.variant_title,
        productTitle,
      )
    : null;

  const maxQuantity =
    selectedVariant?.manage_inventory &&
    !selectedVariant.allow_backorder &&
    typeof selectedVariant.inventory_quantity === "number" &&
    selectedVariant.inventory_quantity > 0
      ? Math.min(MAX_QTY, selectedVariant.inventory_quantity)
      : MAX_QTY;

  const handleOptionSelect = (optionId: string, valueId: string) => {
    setSelectedOptions((prev) => ({ ...prev, [optionId]: valueId }));
    setQuantity(1);
  };

  const handleAddToCart = async () => {
    if (!selectedVariant || isAdding) return;

    setIsAdding(true);
    try {
      await addToCart(selectedVariant.id, quantity, { openSidebar: false });
      flyToCart(addButton.current);
      setJustAdded(true);
      clearTimeout(addedTimer.current);
      addedTimer.current = setTimeout(() => setJustAdded(false), 2200);
    } catch (error) {
      console.error("Failed to add item to cart:", error);
      showErrorToast("Lade die Seite neu und versuch es nochmal.");
    } finally {
      setIsAdding(false);
    }
  };

  // Low stock hint (only when Medusa tracks inventory for the variant)
  const lowStock =
    selectedVariant?.manage_inventory &&
    !selectedVariant.allow_backorder &&
    typeof selectedVariant.inventory_quantity === "number" &&
    selectedVariant.inventory_quantity > 0 &&
    selectedVariant.inventory_quantity <= LOW_STOCK
      ? selectedVariant.inventory_quantity
      : null;

  const isAddToCardButtonDisabled =
    !selectedVariant || isLoadingVariants || !inStock || isAdding;

  if (options.length === 0) {
    return null;
  }

  const buttonLabel = isAdding
    ? "Wird hinzugefügt…"
    : justAdded
      ? "Liegt im Körbchen ✓"
      : selectedVariant && !isLoadingVariants && !inStock
        ? "Ausverkauft"
        : "Rein ins Körbchen";

  return (
    <div className="buy-box">
      {price && (
        <div className="buy-box__price">
          <div className="buy-box__price-row">
            {price.price_type === "sale" && (
              <span className="buy-box__was" data-testid="original-price">
                {price.original_price}
              </span>
            )}
            <span className="buy-box__amount" data-testid="price">
              {price.calculated_price}
            </span>
            <span className="buy-box__tax">
              inkl. MwSt., zzgl. <a href="#versand">Versandkosten</a>
            </span>
          </div>
          {basePrice && (
            <p className="buy-box__base">Grundpreis: {basePrice}</p>
          )}
        </div>
      )}

      {/* A single value isn't a choice (e.g. "Größe: Standard") — hide it */}
      {options
        .filter((option) => (option.values?.length ?? 0) > 1)
        .map((option) => (
          <fieldset key={option.id} className="buy-box__options">
            <legend>{option.title}</legend>
            <div className="buy-box__pills">
              {option.values?.map((value) => (
                <button
                  key={value.id}
                  type="button"
                  className="nav-pill"
                  aria-pressed={selectedOptions[option.id] === value.id}
                  onClick={() => handleOptionSelect(option.id, value.id)}
                >
                  {value.value}
                </button>
              ))}
            </div>
          </fieldset>
        ))}

      <div className="buy-bar">
        <QtyStepper
          size="lg"
          value={quantity}
          label="Anzahl"
          decreaseLabel="Weniger"
          increaseLabel="Mehr"
          disableDecrease={quantity <= 1}
          disableIncrease={quantity >= maxQuantity}
          onDecrease={() => setQuantity((q) => Math.max(1, q - 1))}
          onIncrease={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
        />
        <button
          type="button"
          ref={addButton}
          className="btn btn--primary buy-bar__add"
          disabled={isAddToCardButtonDisabled}
          onClick={handleAddToCart}
        >
          {buttonLabel}
        </button>
      </div>
      {lowStock !== null && !isLoadingVariants && (
        <p className="buy-box__stock">Nur noch {lowStock} Stück da</p>
      )}
      {/* biome-ignore lint/a11y/useSemanticElements: ARIA-Rolle bewusst gesetzt, natives Element würde Darstellung und Verhalten ändern */}
      <span className="sr-only" role="status">
        {justAdded ? `${quantity}× ${productTitle} liegt im Körbchen` : ""}
      </span>
    </div>
  );
};

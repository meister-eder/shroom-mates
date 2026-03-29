/**
 * Shroom-Mates Germany-Only Seed Script
 *
 * Sets up the store for selling exclusively in Germany (DE):
 * - Region: Deutschland (EUR, Germany only)
 * - Tax: 19% standard VAT + 7% reduced VAT (fresh mushrooms qualify under §12 Abs. 2 UStG)
 *   NOTE: Assigning the reduced VAT rate to specific products is done in Medusa Admin
 *   per-product after seeding (requires adding a tax class to each fresh mushroom product).
 * - Stock location: Leipzig, DE
 * - Shipping: Standard (€4.95) + Express (€9.95), Germany only
 * - Products: Frische Pilze, Growkits, Tinkturen with real mushroom images
 *
 * PRICE CONVENTION: Medusa V2 stores prices in MAJOR currency units.
 * €19.95 is stored as 19.95 — NOT as 1995 (cents).
 *
 * PAYMENT PROVIDERS: The seed uses pp_system_default for development.
 * After first run, check which Mollie/SumUp provider IDs are registered via
 * GET /admin/payment-providers and add them to the region in Medusa Admin.
 *
 * IDEMPOTENCY: This script is safe to re-run — it checks for existing data
 * before creating new records.
 */

import { CreateInventoryLevelInput, ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  createApiKeysWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresStep,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows";
import { ApiKey } from "../../.medusa/types/query-entry-points";

const updateStoreCurrencies = createWorkflow(
  "update-store-currencies",
  (input: {
    supported_currencies: { currency_code: string; is_default?: boolean }[];
    store_id: string;
  }) => {
    const normalizedInput = transform({ input }, (data) => {
      return {
        selector: { id: data.input.store_id },
        update: {
          supported_currencies: data.input.supported_currencies.map(
            (currency) => {
              return {
                currency_code: currency.currency_code,
                is_default: currency.is_default ?? false,
              };
            }
          ),
        },
      };
    });

    const stores = updateStoresStep(normalizedInput);

    return new WorkflowResponse(stores);
  }
);

export default async function seedDemoData({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
  const storeModuleService = container.resolve(Modules.STORE);
  const taxModuleService = container.resolve(Modules.TAX);

  // Images are served by Medusa's local file module from backend/static/seed/
  const backendUrl =
    process.env.MEDUSA_BACKEND_URL || "http://localhost:9000";
  const seedImageUrl = (filename: string) =>
    `${backendUrl}/static/seed/${filename}`;


  // ─── Sales Channel ───────────────────────────────────────────────────────────
  logger.info("Seeding store data...");
  const [store] = await storeModuleService.listStores();
  let defaultSalesChannel = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel",
  });

  if (!defaultSalesChannel.length) {
    const { result: salesChannelResult } = await createSalesChannelsWorkflow(
      container,
    ).run({
      input: {
        salesChannelsData: [
          {
            name: "Default Sales Channel",
          },
        ],
      },
    });
    defaultSalesChannel = salesChannelResult;
  }

  // ─── Currency (EUR only) ─────────────────────────────────────────────────────
  await updateStoreCurrencies(container).run({
    input: {
      store_id: store.id,
      supported_currencies: [
        {
          currency_code: "eur",
          is_default: true,
        },
      ],
    },
  });

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        default_sales_channel_id: defaultSalesChannel[0].id,
      },
    },
  });

  // ─── Region: Deutschland ─────────────────────────────────────────────────────
  logger.info("Seeding region data...");
  const { data: existingRegions } = await query.graph({
    entity: "region",
    fields: ["id", "name"],
    filters: { name: "Deutschland" },
  });

  let region: { id: string };

  if (existingRegions?.length) {
    region = existingRegions[0];
    logger.info("Region 'Deutschland' already exists — skipping creation.");
  } else {
    const { result: regionResult } = await createRegionsWorkflow(
      container,
    ).run({
      input: {
        regions: [
          {
            name: "Deutschland",
            currency_code: "eur",
            countries: ["de"],
            // Add Mollie/SumUp provider IDs here once registered.
            // Check active IDs via: GET /admin/payment-providers
            payment_providers: ["pp_system_default"],
          },
        ],
      },
    });
    region = regionResult[0];
  }
  logger.info("Finished seeding regions.");

  // ─── Tax Regions — German VAT ─────────────────────────────────────────────────
  logger.info("Seeding tax regions...");
  const { data: existingTaxRegions } = await query.graph({
    entity: "tax_region",
    fields: ["id", "country_code"],
    filters: { country_code: "de" },
  });

  if (!existingTaxRegions?.length) {
    const { result: taxRegionResult } = await createTaxRegionsWorkflow(
      container,
    ).run({
      input: [{ country_code: "de", provider_id: "tp_system" }],
    });

    const deTaxRegion = taxRegionResult[0];

    // Create German VAT rates.
    // Standard rate (19%) applies by default to all products.
    // Reduced rate (7%) applies to food products (§12 Abs. 2 UStG) — assign
    // the reduced rate to fresh mushroom products via Medusa Admin post-seed.
    await taxModuleService.createTaxRates([
      {
        tax_region_id: deTaxRegion.id,
        rate: 19,
        code: "DE_VAT_STANDARD",
        name: "MwSt. Standard (19%)",
        is_default: true,
      },
      {
        tax_region_id: deTaxRegion.id,
        rate: 7,
        code: "DE_VAT_ERMAESSIGT",
        name: "MwSt. Ermäßigt (7%)",
        is_default: false,
      },
    ]);
    logger.info(
      "Created DE tax region with 19% standard and 7% reduced VAT rates.",
    );
  } else {
    logger.info("DE tax region already exists — skipping creation.");
  }
  logger.info("Finished seeding tax regions.");

  // ─── Stock Location: Leipzig ──────────────────────────────────────────────────
  logger.info("Seeding stock location data...");
  const { data: existingLocations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name"],
    filters: { name: "Shroom-Mates Lager Leipzig" },
  });

  let stockLocation: { id: string };

  if (existingLocations?.length) {
    stockLocation = existingLocations[0];
    logger.info("Stock location already exists — skipping creation.");
  } else {
    const { result: stockLocationResult } = await createStockLocationsWorkflow(
      container,
    ).run({
      input: {
        locations: [
          {
            name: "Shroom-Mates Lager Leipzig",
            address: {
              city: "Leipzig",
              country_code: "DE",
              address_1: "",
            },
          },
        ],
      },
    });
    stockLocation = stockLocationResult[0];

    await updateStoresWorkflow(container).run({
      input: {
        selector: { id: store.id },
        update: {
          default_location_id: stockLocation.id,
        },
      },
    });

    await link.create({
      [Modules.STOCK_LOCATION]: {
        stock_location_id: stockLocation.id,
      },
      [Modules.FULFILLMENT]: {
        fulfillment_provider_id: "manual_manual",
      },
    });
  }

  // ─── Fulfillment & Shipping ───────────────────────────────────────────────────
  logger.info("Seeding fulfillment data...");
  const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({
    type: "default",
  });
  let shippingProfile = shippingProfiles.length ? shippingProfiles[0] : null;

  if (!shippingProfile) {
    const { result: shippingProfileResult } =
      await createShippingProfilesWorkflow(container).run({
        input: {
          data: [
            {
              name: "Default Shipping Profile",
              type: "default",
            },
          ],
        },
      });
    shippingProfile = shippingProfileResult[0];
  }

  const existingFulfillmentSets =
    await fulfillmentModuleService.listFulfillmentSets({
      name: "Deutschland Versand",
    });

  let fulfillmentSet: { id: string; service_zones: { id: string }[] };

  if (existingFulfillmentSets.length) {
    fulfillmentSet = existingFulfillmentSets[0];
    logger.info("Fulfillment set 'Deutschland Versand' already exists — skipping creation.");
  } else {
    fulfillmentSet =
      await fulfillmentModuleService.createFulfillmentSets({
        name: "Deutschland Versand",
        type: "shipping",
        service_zones: [
          {
            name: "Deutschland",
            geo_zones: [
              {
                country_code: "de",
                type: "country",
              },
            ],
          },
        ],
      });

    await link.create({
      [Modules.STOCK_LOCATION]: {
        stock_location_id: stockLocation.id,
      },
      [Modules.FULFILLMENT]: {
        fulfillment_set_id: fulfillmentSet.id,
      },
    });

    await createShippingOptionsWorkflow(container).run({
      input: [
        {
          name: "Standard Versand",
          price_type: "flat",
          provider_id: "manual_manual",
          service_zone_id: fulfillmentSet.service_zones[0].id,
          shipping_profile_id: shippingProfile.id,
          type: {
            label: "Standard",
            description: "Lieferung in 3–5 Werktagen.",
            code: "standard",
          },
          prices: [
            {
              currency_code: "eur",
              amount: 4.95,
              is_tax_inclusive: true,
            },
          ],
          rules: [
            {
              attribute: "enabled_in_store",
              value: "true",
              operator: "eq",
            },
            {
              attribute: "is_return",
              value: "false",
              operator: "eq",
            },
          ],
        },
        {
          name: "Express Versand",
          price_type: "flat",
          provider_id: "manual_manual",
          service_zone_id: fulfillmentSet.service_zones[0].id,
          shipping_profile_id: shippingProfile.id,
          type: {
            label: "Express",
            description: "Lieferung in 1–2 Werktagen.",
            code: "express",
          },
          prices: [
            {
              currency_code: "eur",
              amount: 9.95,
              is_tax_inclusive: true,
            },
          ],
          rules: [
            {
              attribute: "enabled_in_store",
              value: "true",
              operator: "eq",
            },
            {
              attribute: "is_return",
              value: "false",
              operator: "eq",
            },
          ],
        },
      ],
    });
  }
  logger.info("Finished seeding fulfillment data.");

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: stockLocation.id,
      add: [defaultSalesChannel[0].id],
    },
  });
  logger.info("Finished seeding stock location data.");

  // ─── Publishable API Key ───────────────────────────────────────────────────────
  logger.info("Seeding publishable API key data...");
  let publishableApiKey: ApiKey | null = null;
  const { data } = await query.graph({
    entity: "api_key",
    fields: ["id"],
    filters: { type: "publishable" },
  });

  publishableApiKey = data?.[0];

  if (!publishableApiKey) {
    const {
      result: [publishableApiKeyResult],
    } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [
          {
            title: "Webshop",
            type: "publishable",
            created_by: "",
          },
        ],
      },
    });
    publishableApiKey = publishableApiKeyResult as ApiKey;
  }

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: {
      id: publishableApiKey.id,
      add: [defaultSalesChannel[0].id],
    },
  });
  logger.info("Finished seeding publishable API key data.");

  // ─── Product Categories ────────────────────────────────────────────────────────
  logger.info("Seeding product data...");
  const { data: existingCategories } = await query.graph({
    entity: "product_category",
    fields: ["id", "handle"],
  });

  const existingHandles = new Set(
    (existingCategories ?? []).map((c: { handle: string }) => c.handle),
  );

  const categoriesToCreate = [
    { name: "Frische Pilze", handle: "frische-pilze", is_active: true },
    { name: "Growkits", handle: "growkits", is_active: true },
    { name: "Tinkturen", handle: "tinkturen", is_active: true },
  ].filter((cat) => !existingHandles.has(cat.handle));

  let allCategories: { id: string; name: string; handle: string }[] = [
    ...((existingCategories ?? []) as { id: string; name: string; handle: string }[]),
  ];

  if (categoriesToCreate.length) {
    const { result: newCategoryResult } =
      await createProductCategoriesWorkflow(container).run({
        input: { product_categories: categoriesToCreate },
      });
    allCategories = [...allCategories, ...(newCategoryResult as typeof allCategories)];
  }

  const getCategoryId = (handle: string) =>
    allCategories.find((c) => c.handle === handle)?.id;

  // ─── Products ─────────────────────────────────────────────────────────────────
  const { data: existingProducts } = await query.graph({
    entity: "product",
    fields: ["id", "handle"],
  });

  const existingProductHandles = new Set(
    (existingProducts ?? []).map((p: { handle: string }) => p.handle),
  );

  const productsToSeed = [
    // ── Frische Pilze ──────────────────────────────────────────────────────────
    {
      title: "Lion's Mane",
      handle: "lions-mane",
      description:
        "Hericium erinaceus — der Löwenmähnen-Pilz aus Leipzig. Frisch geerntet, mit feinem Meeresfrüchte-Aroma. Ideal zum Braten oder als Fleischersatz.",
      category_ids: [getCategoryId("frische-pilze")!],
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfile.id,
      images: [
        { url: seedImageUrl("lions_mane.jpg") },
      ],
      options: [{ title: "Gewicht", values: ["250g", "500g", "1kg"] }],
      variants: [
        {
          title: "250g",
          sku: "LIONS-MANE-250G",
          options: { Gewicht: "250g" },
          prices: [
            { amount: 8.95, currency_code: "eur", is_tax_inclusive: true },
            
          ],
        },
        {
          title: "500g",
          sku: "LIONS-MANE-500G",
          options: { Gewicht: "500g" },
          prices: [
            { amount: 15.95, currency_code: "eur", is_tax_inclusive: true },
            
          ],
        },
        {
          title: "1kg",
          sku: "LIONS-MANE-1KG",
          options: { Gewicht: "1kg" },
          prices: [
            { amount: 28.95, currency_code: "eur", is_tax_inclusive: true },
            
          ],
        },
      ],
      sales_channels: [{ id: defaultSalesChannel[0].id }],
    },
    {
      title: "Pioppino",
      handle: "pioppino",
      description:
        "Cyclocybe aegerita — der Pappel-Schüppling aus Leipzig. Kräftiger Geschmack mit fester Textur. Toll in Suppen, Saucen und Risotto.",
      category_ids: [getCategoryId("frische-pilze")!],
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfile.id,
      images: [
        { url: seedImageUrl("pioppino.jpg") },
      ],
      options: [{ title: "Gewicht", values: ["250g", "500g"] }],
      variants: [
        {
          title: "250g",
          sku: "PIOPPINO-250G",
          options: { Gewicht: "250g" },
          prices: [
            { amount: 6.95, currency_code: "eur", is_tax_inclusive: true },
            
          ],
        },
        {
          title: "500g",
          sku: "PIOPPINO-500G",
          options: { Gewicht: "500g" },
          prices: [
            { amount: 11.95, currency_code: "eur", is_tax_inclusive: true },
            
          ],
        },
      ],
      sales_channels: [{ id: defaultSalesChannel[0].id }],
    },
    {
      title: "Black Pearl Auster",
      handle: "black-pearl-auster",
      description:
        "Pleurotus ostreatus var. — dunkelbraune Austernpilze mit mildem, nussigem Aroma. Frisch aus unserem Leipziger Anbau.",
      category_ids: [getCategoryId("frische-pilze")!],
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfile.id,
      images: [
        { url: seedImageUrl("black_pearl.jpg") },
      ],
      options: [{ title: "Gewicht", values: ["250g", "500g"] }],
      variants: [
        {
          title: "250g",
          sku: "BLACK-PEARL-250G",
          options: { Gewicht: "250g" },
          prices: [
            { amount: 5.95, currency_code: "eur", is_tax_inclusive: true },
            
          ],
        },
        {
          title: "500g",
          sku: "BLACK-PEARL-500G",
          options: { Gewicht: "500g" },
          prices: [
            { amount: 9.95, currency_code: "eur", is_tax_inclusive: true },
            
          ],
        },
      ],
      sales_channels: [{ id: defaultSalesChannel[0].id }],
    },
    {
      title: "White Pearl Auster",
      handle: "white-pearl-auster",
      description:
        "Pleurotus ostreatus — hell-cremefarbene Austernpilze mit zartem Geschmack. Vielseitig einsetzbar und ideal für Einsteiger.",
      category_ids: [getCategoryId("frische-pilze")!],
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfile.id,
      images: [
        { url: seedImageUrl("white_pearl.jpg") },
      ],
      options: [{ title: "Gewicht", values: ["250g", "500g"] }],
      variants: [
        {
          title: "250g",
          sku: "WHITE-PEARL-250G",
          options: { Gewicht: "250g" },
          prices: [
            { amount: 5.95, currency_code: "eur", is_tax_inclusive: true },
            
          ],
        },
        {
          title: "500g",
          sku: "WHITE-PEARL-500G",
          options: { Gewicht: "500g" },
          prices: [
            { amount: 9.95, currency_code: "eur", is_tax_inclusive: true },
            
          ],
        },
      ],
      sales_channels: [{ id: defaultSalesChannel[0].id }],
    },
    // ── Growkits ───────────────────────────────────────────────────────────────
    {
      title: "Lion's Mane Growkit",
      handle: "lions-mane-growkit",
      description:
        "Züchte deinen eigenen Lion's Mane zu Hause! Unser Growkit enthält fertig beimpftes Substrat und ist bereit zur Ernte — auch für Anfänger geeignet. Erwarte 1–2 Ernten à 150–300 g.",
      category_ids: [getCategoryId("growkits")!],
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfile.id,
      images: [
        { url: seedImageUrl("growkits.jpg") },
      ],
      options: [{ title: "Größe", values: ["Standard"] }],
      variants: [
        {
          title: "Standard",
          sku: "GROWKIT-LIONS-MANE",
          options: { Größe: "Standard" },
          prices: [
            { amount: 19.95, currency_code: "eur", is_tax_inclusive: true },
            
          ],
        },
      ],
      sales_channels: [{ id: defaultSalesChannel[0].id }],
    },
    {
      title: "Austernseitlinge Growkit",
      handle: "austernseitlinge-growkit",
      description:
        "Züchte deine eigenen Austernpilze! Dieses Growkit mit vorbereitetem Substrat eignet sich perfekt als Einstieg in die Heimzucht. Mehrere Ernten möglich.",
      category_ids: [getCategoryId("growkits")!],
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfile.id,
      images: [
        { url: seedImageUrl("growkits.jpg") },
      ],
      options: [{ title: "Größe", values: ["Standard"] }],
      variants: [
        {
          title: "Standard",
          sku: "GROWKIT-AUSTERN",
          options: { Größe: "Standard" },
          prices: [
            { amount: 14.95, currency_code: "eur", is_tax_inclusive: true },
            
          ],
        },
      ],
      sales_channels: [{ id: defaultSalesChannel[0].id }],
    },
    // ── Tinkturen ──────────────────────────────────────────────────────────────
    {
      title: "Lion's Mane Tinktur 50ml",
      handle: "lions-mane-tinktur",
      description:
        "Hochdosierter Doppelextrakt aus frischen Lion's Mane Pilzen. Hot-water und alkohol-extrahiert für maximale Bioverfügbarkeit der Betaglukane und Hericenone. 50 ml, ca. 50 Portionen.",
      category_ids: [getCategoryId("tinkturen")!],
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfile.id,
      images: [
        { url: seedImageUrl("tinkturen.jpeg") },
      ],
      options: [{ title: "Größe", values: ["50ml"] }],
      variants: [
        {
          title: "50ml",
          sku: "TINKTUR-LIONS-MANE-50ML",
          options: { Größe: "50ml" },
          prices: [
            { amount: 24.95, currency_code: "eur", is_tax_inclusive: true },
            
          ],
        },
      ],
      sales_channels: [{ id: defaultSalesChannel[0].id }],
    },
  ].filter((p) => !existingProductHandles.has(p.handle));

  if (productsToSeed.length) {
    await createProductsWorkflow(container).run({
      input: { products: productsToSeed },
    });
    logger.info(`Seeded ${productsToSeed.length} products.`);
  } else {
    logger.info("All products already exist — skipping product creation.");
  }
  logger.info("Finished seeding product data.");

  // ─── Inventory ─────────────────────────────────────────────────────────────────
  logger.info("Seeding inventory levels...");
  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
  });

  const { data: existingInventoryLevels } = await query.graph({
    entity: "inventory_level",
    fields: ["inventory_item_id"],
    filters: { location_id: stockLocation.id },
  });

  const itemsWithLevel = new Set(
    (existingInventoryLevels ?? []).map(
      (l: { inventory_item_id: string }) => l.inventory_item_id,
    ),
  );

  const inventoryLevels: CreateInventoryLevelInput[] = inventoryItems
    .filter((item: { id: string }) => !itemsWithLevel.has(item.id))
    .map((inventoryItem: { id: string }) => ({
      location_id: stockLocation.id,
      stocked_quantity: 100,
      inventory_item_id: inventoryItem.id,
    }));

  if (inventoryLevels.length) {
    await createInventoryLevelsWorkflow(container).run({
      input: { inventory_levels: inventoryLevels },
    });
    logger.info(`Created inventory levels for ${inventoryLevels.length} items.`);
  } else {
    logger.info("Inventory levels already set — skipping.");
  }
  logger.info("Finished seeding inventory levels.");
}

import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { updateRegionsWorkflow } from "@medusajs/medusa/core-flows";

const SUMUP_PROVIDER_ID = "pp_sumup_sumup";

/**
 * Adds the SumUp payment provider to every region, keeping the providers a
 * region already has. Safe to run repeatedly.
 *
 *   npx medusa exec ./src/scripts/enable-sumup.ts
 */
export default async function enableSumUp({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const { data: providers } = await query.graph({
    entity: "payment_provider",
    fields: ["id", "is_enabled"],
    filters: { id: SUMUP_PROVIDER_ID },
  });
  if (!providers.length) {
    throw new Error(
      `${SUMUP_PROVIDER_ID} is not registered — is SUMUP_API_KEY set for the backend?`,
    );
  }

  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "name", "payment_providers.id"],
  });

  for (const region of regions) {
    const current = (region.payment_providers ?? [])
      .map((p) => p?.id)
      .filter((id): id is string => !!id);

    if (current.includes(SUMUP_PROVIDER_ID)) {
      logger.info(`Region "${region.name}": SumUp already enabled`);
      continue;
    }

    await updateRegionsWorkflow(container).run({
      input: {
        selector: { id: region.id },
        update: { payment_providers: [...current, SUMUP_PROVIDER_ID] },
      },
    });
    logger.info(`Region "${region.name}": enabled SumUp (${[...current, SUMUP_PROVIDER_ID].join(", ")})`);
  }
}

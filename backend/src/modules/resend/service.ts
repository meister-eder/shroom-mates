import type {
  Logger,
  ProviderSendNotificationDTO,
  ProviderSendNotificationResultsDTO,
} from "@medusajs/framework/types";
import {
  AbstractNotificationProviderService,
  MedusaError,
} from "@medusajs/framework/utils";

type InjectedDependencies = {
  logger: Logger;
};

export type ResendOptions = {
  /** API key with "Sending access" only */
  apiKey: string;
  /** e.g. "shroom-mates <bestellung@shroom-mates.de>" (domain verified in Resend) */
  from: string;
  /** Where customer replies go, e.g. hey@shroom-mates.de */
  replyTo?: string;
};

const RESEND_API = "https://api.resend.com/emails";

/**
 * Sends emails through Resend's HTTP API. Callers pass the rendered
 * subject/html/text in `content` (see src/lib/emails).
 */
class ResendNotificationService extends AbstractNotificationProviderService {
  static identifier = "resend";

  protected logger_: Logger;
  protected options_: ResendOptions;

  static validateOptions(options: Record<string, unknown>) {
    if (!options.apiKey) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Resend: apiKey is required.");
    }
    if (!options.from) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Resend: from is required.");
    }
  }

  constructor({ logger }: InjectedDependencies, options: ResendOptions) {
    super();
    this.logger_ = logger;
    this.options_ = options;
  }

  async send(
    notification: ProviderSendNotificationDTO,
  ): Promise<ProviderSendNotificationResultsDTO> {
    const { subject, html, text } = notification.content ?? {};
    if (!subject || !(html || text)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Resend: notification "${notification.template}" has no rendered content.`,
      );
    }

    const response = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.options_.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: notification.from || this.options_.from,
        to: [notification.to],
        ...(this.options_.replyTo && { reply_to: this.options_.replyTo }),
        subject,
        html,
        text,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      const body = (await response.text().catch(() => "")).slice(0, 300);
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Resend rejected "${notification.template}" (${response.status}): ${body}`,
      );
    }

    const { id } = (await response.json()) as { id: string };
    this.logger_.info(`Resend: sent "${notification.template}" (${id})`);
    return { id };
  }
}

export default ResendNotificationService;

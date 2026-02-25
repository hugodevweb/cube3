import { Injectable, Logger } from '@nestjs/common';

const WEBHOOK_URL =
  'https://hook.eu1.make.com/raugwidl5yfj24gv2jygyls6yqw9e3yr';

export interface OrderCreatedPayload {
  orderId: string;
  userId: string;
  total: number;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  async onOrderCreated(payload: OrderCreatedPayload): Promise<void> {
    this.logger.log(`Received order.created for order ${payload.orderId} — forwarding to webhook`);

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'order.created',
          ...payload,
        }),
      });

      if (response.ok) {
        this.logger.log(`Webhook delivered for order ${payload.orderId} (HTTP ${response.status})`);
      } else {
        this.logger.warn(`Webhook returned HTTP ${response.status} for order ${payload.orderId}`);
      }
    } catch (err) {
      this.logger.error(`Webhook delivery failed for order ${payload.orderId}: ${(err as Error).message}`);
    }
  }
}

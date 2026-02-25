import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificationsService, OrderCreatedPayload } from './notifications.service';

@Controller()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @EventPattern('order.created')
  handleOrderCreated(@Payload() payload: OrderCreatedPayload): Promise<void> {
    return this.notificationsService.onOrderCreated(payload);
  }
}

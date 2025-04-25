import { IsEnum } from 'class-validator';
import { PaymentStatus } from '../enums/payment-status.enum';

export class UpdatePaymentStatusDto {
  @IsEnum(PaymentStatus)
  status: PaymentStatus;
}

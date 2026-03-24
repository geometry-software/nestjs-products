import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export const SHIPPING_STATUSES = [
  'pending',
  'in_transit',
  'on_the_way',
  'delivered',
  'cancelled',
  'delayed',
] as const;

export type ShippingStatus = (typeof SHIPPING_STATUSES)[number];

export class CreateShipmentDto {
  @IsNotEmpty()
  @IsString()
  customer: string;

  @IsNotEmpty()
  @IsString()
  date: string;

  @IsNotEmpty()
  @IsString()
  destination: string;
}

export class UpdateShipmentDto {
  @IsOptional()
  @IsString()
  customer?: string;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  destination?: string;
}

export class UpdateShipmentStatusDto {
  @IsIn(SHIPPING_STATUSES)
  status: ShippingStatus;

  @IsOptional()
  @IsString()
  note?: string;
}

export type ShipmentHistoryOutDto = {
  status: ShippingStatus;
  note?: string;
  changedAt: string;
};

export type ShipmentOutDto = {
  id: string;
  customer: string;
  date: string;
  destination: string;
  status: ShippingStatus;
  createdAt: string;
  updatedAt: string;
  history: ShipmentHistoryOutDto[];
};
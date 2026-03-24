import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { SHIPPING_STATUSES } from '../dto/shipment.dto';
import type { ShippingStatus } from '../dto/shipment.dto';

export type ShipmentDocument = HydratedDocument<Shipment>;

@Schema({ _id: false, versionKey: false })
export class ShipmentHistoryItem {
  @Prop({ type: String, enum: SHIPPING_STATUSES, required: true })
  status: ShippingStatus;

  @Prop({ type: String, required: false, trim: true })
  note?: string;

  @Prop({ type: Date, required: true })
  changedAt: Date;
}

const ShipmentHistoryItemSchema = SchemaFactory.createForClass(ShipmentHistoryItem);

@Schema({ collection: 'shipments', versionKey: false })
export class Shipment {
  @Prop({ type: String, required: true, trim: true })
  customer: string;

  @Prop({ type: String, required: true, trim: true })
  date: string;

  @Prop({ type: String, required: true, trim: true })
  destination: string;

  @Prop({ type: String, enum: SHIPPING_STATUSES, required: true, default: 'pending' })
  status: ShippingStatus;

  @Prop({ type: [ShipmentHistoryItemSchema], required: true, default: [] })
  history: ShipmentHistoryItem[];

  @Prop({ type: Date, required: true })
  createdAt: Date;

  @Prop({ type: Date, required: true })
  updatedAt: Date;
}

export const ShipmentSchema = SchemaFactory.createForClass(Shipment);

ShipmentSchema.index({ customer: 1 });
ShipmentSchema.index({ destination: 1 });
ShipmentSchema.index({ status: 1 });
ShipmentSchema.index({ createdAt: -1 });
ShipmentSchema.index({ updatedAt: -1 });
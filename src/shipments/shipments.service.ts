import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CrudService } from '../common/crud/crud.service';
import { Shipment, ShipmentDocument } from './schemas/shipment.schema';
import {
  CreateShipmentDto,
  ShipmentOutDto,
  ShippingStatus,
  UpdateShipmentDto,
} from './dto/shipment.dto';

@Injectable()
export class ShipmentsService extends CrudService<
  ShipmentDocument,
  CreateShipmentDto,
  UpdateShipmentDto,
  ShipmentOutDto
> {
  constructor(@InjectModel(Shipment.name) model: Model<ShipmentDocument>) {
    super(model, {
      entityName: Shipment.name,
      filterableFields: [
        'customer',
        'date',
        'destination',
        'status',
        'createdAt',
        'updatedAt',
      ],
      sortableFields: ['createdAt', 'updatedAt', 'customer', 'destination', 'date', 'status'],
      defaultSort: { createdAt: -1 },
      createDateField: 'createdAt',
      modifyDateField: 'updatedAt',
      dateRangeFields: ['createdAt', 'updatedAt'],
      searchableFields: ['customer', 'destination', 'date', 'status'],
    });
  }

  protected override mapCreateDto(dto: CreateShipmentDto): Partial<ShipmentDocument> {
    return {
      customer: dto.customer,
      date: dto.date,
      destination: dto.destination,
      status: 'pending',
      history: [
        {
          status: 'pending',
          changedAt: new Date(),
        },
      ],
    } as Partial<ShipmentDocument>;
  }

  protected override mapUpdateDto(dto: UpdateShipmentDto): Partial<ShipmentDocument> {
    return {
      ...dto,
    } as Partial<ShipmentDocument>;
  }

  protected override mapDocToOut(doc: any): ShipmentOutDto {
    return {
      id: String(doc._id),
      customer: doc.customer,
      date: doc.date,
      destination: doc.destination,
      status: doc.status,
      createdAt: new Date(doc.createdAt).toISOString(),
      updatedAt: new Date(doc.updatedAt).toISOString(),
      history: Array.isArray(doc.history)
        ? doc.history.map((item: any) => ({
            status: item.status,
            note: item.note,
            changedAt: new Date(item.changedAt).toISOString(),
          }))
        : [],
    };
  }

  async updateStatus(id: string, status: ShippingStatus, note?: string): Promise<ShipmentOutDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`${Shipment.name} not found`);
    }

    const now = new Date();

    const doc = await this.model
      .findByIdAndUpdate(
        id,
        {
          $set: {
            status,
            updatedAt: now,
          },
          $push: {
            history: {
              status,
              note,
              changedAt: now,
            },
          },
        },
        { new: true },
      )
      .lean();

    if (!doc) {
      throw new NotFoundException(`${Shipment.name} not found`);
    }

    return this.mapDocToOut(doc);
  }
}
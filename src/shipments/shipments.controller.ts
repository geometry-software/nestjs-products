import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CrudListQueryDto } from '../common/crud/crud.query.dto';
import { PaginatedResult } from '../common/crud/crud.types';
import {
  CreateShipmentDto,
  ShipmentOutDto,
  UpdateShipmentDto,
  UpdateShipmentStatusDto,
} from './dto/shipment.dto';
import { ShipmentsService } from './shipments.service';

type ShipmentsFindAllQuery = CrudListQueryDto & Record<string, string | string[]>;

@UseGuards(JwtAuthGuard)
@Controller('shipments')
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Post()
  create(@Body() dto: CreateShipmentDto): Promise<ShipmentOutDto> {
    return this.shipmentsService.create(dto);
  }

  @Get()
  findAll(@Query() query: ShipmentsFindAllQuery): Promise<PaginatedResult<ShipmentOutDto>> {
    return this.shipmentsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<ShipmentOutDto> {
    return this.shipmentsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateShipmentDto): Promise<ShipmentOutDto> {
    return this.shipmentsService.update(id, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateShipmentStatusDto,
  ): Promise<ShipmentOutDto> {
    return this.shipmentsService.updateStatus(id, dto.status, dto.note);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<{ ok: true }> {
    return this.shipmentsService.remove(id);
  }
}
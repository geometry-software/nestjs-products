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
import { ProductsService } from './products.service';
import { CreateProductDto, ProductOutDto, UpdateProductDto } from './dto/product.dto';
import { PaginatedResult } from '../common/crud/crud.types';

type ProductsFindAllQuery = CrudListQueryDto & Record<string, string | string[]>;

@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Body() dto: CreateProductDto): Promise<ProductOutDto> {
    return this.productsService.create(dto);
  }

  @Get()
  findAll(@Query() query: ProductsFindAllQuery): Promise<PaginatedResult<ProductOutDto>> {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<ProductOutDto> {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto): Promise<ProductOutDto> {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<{ ok: true }> {
    return this.productsService.remove(id);
  }
}

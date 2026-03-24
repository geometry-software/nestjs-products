import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CrudService } from '../common/crud/crud.service';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductDto, ProductOutDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService extends CrudService<
  ProductDocument,
  CreateProductDto,
  UpdateProductDto,
  ProductOutDto
> {
  constructor(@InjectModel(Product.name) model: Model<ProductDocument>) {
    super(model, {
      entityName: Product.name,
      filterableFields: ['name', 'description', 'price', 'active', 'createdAt', 'updatedAt'],
      sortableFields: ['createdAt', 'updatedAt', 'price', 'name'],
      defaultSort: { createdAt: -1 },
      createDateField: 'createdAt',
      modifyDateField: 'updatedAt',
      dateRangeFields: ['createdAt', 'updatedAt'],
      searchableFields: ['name', 'description'],
    });
  }

}

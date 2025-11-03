// src/products/products.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
  ) {}

  create(data: { name: string; description?: string; price: number }) {
    return this.productModel.create(data);
  }

  findAll() {
    return this.productModel.find().sort({ createdAt: -1 }).lean();
  }

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Product not found');
    const doc = await this.productModel.findById(id).lean();
    if (!doc) throw new NotFoundException('Product not found');
    return doc;
  }

  async update(id: string, data: Partial<{ name: string; description?: string; price: number }>) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Product not found');
    const doc = await this.productModel.findByIdAndUpdate(id, data, { new: true }).lean();
    if (!doc) throw new NotFoundException('Product not found');
    return doc;
  }

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Product not found');
    const res = await this.productModel.findByIdAndDelete(id).lean();
    if (!res) throw new NotFoundException('Product not found');
    return { ok: true };
  }
}

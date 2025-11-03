import { IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty() name: string;
  @IsOptional() description?: string;
  @IsNumber() @Min(0) price: number;
}
export class UpdateProductDto {
  @IsOptional() name?: string;
  @IsOptional() description?: string;
  @IsOptional() @IsNumber() @Min(0) price?: number;
}

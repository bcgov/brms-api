import { IsOptional, IsString, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @IsString()
  page?: number;

  @IsOptional()
  @IsString()
  pageSize?: number;

  @IsOptional()
  @IsString()
  sortField?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'ascend' | 'descend';

  @IsOptional()
  @IsObject()
  @Type(() => Object)
  filters?: Record<string, any>;

  @IsOptional()
  @IsString()
  searchTerm?: string;
}

export class CategoryObject {
  @IsObject()
  @Type(() => Object)
  text: string;
  value: string;
}

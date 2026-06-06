import { IsOptional, IsInt, Min, Max, IsString, IsIn, IsNumber, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

const ALLOWED_SORT_FIELDS = [
  'id', 'name', 'species', 'breed', 'gender',
  'birthDate', 'weight', 'status', 'cageNumber',
  'rfidTag', 'source', 'createdAt', 'updatedAt',
] as const;

export class QueryAnimalDto {
  @ApiPropertyOptional({ description: '页码', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 10;

  @ApiPropertyOptional({ description: '物种筛选', example: '小鼠' })
  @IsOptional()
  @IsString()
  species?: string;

  @ApiPropertyOptional({ description: '状态筛选', example: 'healthy' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: '关键词搜索（匹配名称/物种/品系/来源）', example: 'M-001' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '最小体重(g)', example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  weightMin?: number;

  @ApiPropertyOptional({ description: '最大体重(g)', example: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  weightMax?: number;

  @ApiPropertyOptional({ description: '出生日期起始', example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  birthDateStart?: string;

  @ApiPropertyOptional({ description: '出生日期截止', example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  birthDateEnd?: string;

  @ApiPropertyOptional({ description: '排序字段', example: 'createdAt', enum: ALLOWED_SORT_FIELDS })
  @IsOptional()
  @IsIn(ALLOWED_SORT_FIELDS)
  sortBy?: string;

  @ApiPropertyOptional({ description: '排序方向', example: 'DESC', enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';
}

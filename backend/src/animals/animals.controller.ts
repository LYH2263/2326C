import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AnimalsService } from './animals.service';
import { CreateAnimalDto } from './dto/create-animal.dto';
import { UpdateAnimalDto } from './dto/update-animal.dto';
import { QueryAnimalDto } from './dto/query-animal.dto';

@ApiTags('动物管理')
@Controller('animals')
export class AnimalsController {
  constructor(private readonly animalsService: AnimalsService) {}

  @Post()
  @ApiOperation({ summary: '添加动物' })
  create(@Body() createAnimalDto: CreateAnimalDto) {
    return this.animalsService.create(createAnimalDto);
  }

  @Get()
  @ApiOperation({ summary: '查询动物列表' })
  findAll(@Query() query: QueryAnimalDto) {
    return this.animalsService.findAll(query);
  }

  @Get('species')
  @ApiOperation({ summary: '获取物种列表' })
  getSpeciesList() {
    return this.animalsService.getSpeciesList();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取动物详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.animalsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新动物信息' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAnimalDto: UpdateAnimalDto,
  ) {
    return this.animalsService.update(id, updateAnimalDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除动物' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.animalsService.remove(id);
  }
}

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Animal } from './entities/animal.entity';
import { CreateAnimalDto } from './dto/create-animal.dto';
import { UpdateAnimalDto } from './dto/update-animal.dto';
import { QueryAnimalDto } from './dto/query-animal.dto';

@Injectable()
export class AnimalsService {
  private readonly logger = new Logger(AnimalsService.name);

  constructor(
    @InjectRepository(Animal)
    private readonly animalRepository: Repository<Animal>,
  ) {}

  async create(createAnimalDto: CreateAnimalDto): Promise<Animal> {
    const animal = this.animalRepository.create(createAnimalDto);
    const saved = await this.animalRepository.save(animal);
    this.logger.log(`Created animal: ${saved.id} - ${saved.name}`);
    return saved;
  }

  async findAll(query: QueryAnimalDto): Promise<{ list: Animal[]; total: number }> {
    const {
      page = 1,
      pageSize = 10,
      species,
      status,
      keyword,
      weightMin,
      weightMax,
      birthDateStart,
      birthDateEnd,
      sortBy,
      sortOrder,
    } = query;

    const qb: SelectQueryBuilder<Animal> = this.animalRepository.createQueryBuilder('animal');

    if (species) {
      qb.andWhere('animal.species = :species', { species });
    }

    if (status) {
      qb.andWhere('animal.status = :status', { status });
    }

    if (keyword) {
      qb.andWhere(
        '(animal.name LIKE :keyword OR animal.species LIKE :keyword OR animal.breed LIKE :keyword OR animal.source LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    if (weightMin !== undefined) {
      qb.andWhere('animal.weight >= :weightMin', { weightMin });
    }

    if (weightMax !== undefined) {
      qb.andWhere('animal.weight <= :weightMax', { weightMax });
    }

    if (birthDateStart) {
      qb.andWhere('animal.birthDate >= :birthDateStart', { birthDateStart });
    }

    if (birthDateEnd) {
      qb.andWhere('animal.birthDate <= :birthDateEnd', { birthDateEnd });
    }

    if (sortBy) {
      qb.orderBy(`animal.${sortBy}`, sortOrder || 'DESC');
    } else {
      qb.orderBy('animal.createdAt', 'DESC');
    }

    qb.skip((page - 1) * pageSize);
    qb.take(pageSize);

    const [list, total] = await qb.getManyAndCount();

    return { list, total };
  }

  async findOne(id: number): Promise<Animal> {
    const animal = await this.animalRepository.findOne({
      where: { id },
      relations: ['healthRecords', 'feedingRecords', 'experimentAnimals'],
    });
    if (!animal) {
      throw new NotFoundException(`动物 #${id} 不存在`);
    }
    return animal;
  }

  async update(id: number, updateAnimalDto: UpdateAnimalDto): Promise<Animal> {
    const animal = await this.findOne(id);
    Object.assign(animal, updateAnimalDto);
    const updated = await this.animalRepository.save(animal);
    this.logger.log(`Updated animal: ${updated.id}`);
    return updated;
  }

  async remove(id: number): Promise<void> {
    const animal = await this.findOne(id);
    await this.animalRepository.remove(animal);
    this.logger.log(`Removed animal: ${id}`);
  }

  async getSpeciesList(): Promise<string[]> {
    const result = await this.animalRepository
      .createQueryBuilder('animal')
      .select('DISTINCT animal.species', 'species')
      .getRawMany();
    return result.map((r) => r.species);
  }

  async count(): Promise<number> {
    return this.animalRepository.count();
  }

  async countByStatus(): Promise<{ status: string; count: number }[]> {
    return this.animalRepository
      .createQueryBuilder('animal')
      .select('animal.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('animal.status')
      .getRawMany();
  }

  async countBySpecies(): Promise<{ species: string; count: number }[]> {
    return this.animalRepository
      .createQueryBuilder('animal')
      .select('animal.species', 'species')
      .addSelect('COUNT(*)', 'count')
      .groupBy('animal.species')
      .getRawMany();
  }
}

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { AnimalsService } from './animals.service';
import { Animal } from './entities/animal.entity';
import { CreateAnimalDto } from './dto/create-animal.dto';
import { UpdateAnimalDto } from './dto/update-animal.dto';
import { QueryAnimalDto } from './dto/query-animal.dto';

const mockAnimal: Animal = {
  id: 1,
  name: 'M-001',
  species: '小鼠',
  breed: 'C57BL/6',
  gender: 'male',
  birthDate: new Date('2025-06-15'),
  weight: 25.3,
  status: 'healthy',
  cageNumber: 'A-101',
  rfidTag: 'RFID-001',
  source: '实验动物中心',
  description: '测试动物',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  healthRecords: [],
  feedingRecords: [],
  experimentAnimals: [],
};

type MockRepository = {
  create: jest.Mock;
  save: jest.Mock;
  findOne: jest.Mock;
  remove: jest.Mock;
  count: jest.Mock;
  createQueryBuilder: jest.Mock;
};

type MockQueryBuilder = {
  select: jest.Mock;
  addSelect: jest.Mock;
  where: jest.Mock;
  andWhere: jest.Mock;
  orderBy: jest.Mock;
  skip: jest.Mock;
  take: jest.Mock;
  groupBy: jest.Mock;
  getManyAndCount: jest.Mock;
  getRawMany: jest.Mock;
  getOne: jest.Mock;
};

const createMockQueryBuilder = (): MockQueryBuilder => ({
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn().mockResolvedValue([[mockAnimal], 1]),
  getRawMany: jest.fn().mockResolvedValue([]),
  getOne: jest.fn().mockResolvedValue(null),
});

describe('AnimalsService', () => {
  let service: AnimalsService;
  let repository: MockRepository;
  let queryBuilder: MockQueryBuilder;

  beforeEach(async () => {
    queryBuilder = createMockQueryBuilder();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnimalsService,
        {
          provide: getRepositoryToken(Animal),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
            count: jest.fn(),
            createQueryBuilder: jest.fn(() => queryBuilder),
          },
        },
      ],
    }).compile();

    service = module.get<AnimalsService>(AnimalsService);
    repository = module.get(getRepositoryToken(Animal));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an animal successfully', async () => {
      const createDto: CreateAnimalDto = {
        name: 'M-001',
        species: '小鼠',
        gender: 'male',
        status: 'healthy',
        breed: 'C57BL/6',
      };

      repository.create.mockReturnValue(mockAnimal);
      repository.save.mockResolvedValue(mockAnimal);

      const result = await service.create(createDto);

      expect(repository.create).toHaveBeenCalledTimes(1);
      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(repository.save).toHaveBeenCalledWith(mockAnimal);
      expect(result).toEqual(mockAnimal);
    });
  });

  describe('findAll', () => {
    it('should return paginated results with default parameters', async () => {
      const query: QueryAnimalDto = {};
      const mockList = [mockAnimal, { ...mockAnimal, id: 2 }];
      const mockTotal = 2;

      (queryBuilder.getManyAndCount as jest.Mock).mockResolvedValue([mockList, mockTotal]);

      const result = await service.findAll(query);

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('animal');
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('animal.createdAt', 'DESC');
      expect(queryBuilder.skip).toHaveBeenCalledWith(0);
      expect(queryBuilder.take).toHaveBeenCalledWith(10);
      expect(queryBuilder.getManyAndCount).toHaveBeenCalledTimes(1);
      expect(result.list).toEqual(mockList);
      expect(result.total).toEqual(mockTotal);
    });

    it('should build LIKE conditions correctly when keyword is provided', async () => {
      const query: QueryAnimalDto = { keyword: 'M-001' };

      await service.findAll(query);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        '(animal.name LIKE :keyword OR animal.species LIKE :keyword OR animal.breed LIKE :keyword OR animal.source LIKE :keyword)',
        { keyword: '%M-001%' },
      );
    });

    it('should apply species and status filters together', async () => {
      const query: QueryAnimalDto = { species: '小鼠', status: 'healthy' };

      await service.findAll(query);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith('animal.species = :species', { species: '小鼠' });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('animal.status = :status', { status: 'healthy' });
    });

    it('should calculate skip and take correctly with custom page and pageSize', async () => {
      const query: QueryAnimalDto = { page: 3, pageSize: 20 };

      await service.findAll(query);

      expect(queryBuilder.skip).toHaveBeenCalledWith(40);
      expect(queryBuilder.take).toHaveBeenCalledWith(20);
    });

    it('should apply weight range filters', async () => {
      const query: QueryAnimalDto = { weightMin: 20, weightMax: 50 };

      await service.findAll(query);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith('animal.weight >= :weightMin', { weightMin: 20 });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('animal.weight <= :weightMax', { weightMax: 50 });
    });

    it('should apply birth date range filters', async () => {
      const query: QueryAnimalDto = { birthDateStart: '2025-01-01', birthDateEnd: '2025-12-31' };

      await service.findAll(query);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith('animal.birthDate >= :birthDateStart', { birthDateStart: '2025-01-01' });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('animal.birthDate <= :birthDateEnd', { birthDateEnd: '2025-12-31' });
    });

    it('should use custom sort field and order', async () => {
      const query: QueryAnimalDto = { sortBy: 'name', sortOrder: 'ASC' };

      await service.findAll(query);

      expect(queryBuilder.orderBy).toHaveBeenCalledWith('animal.name', 'ASC');
    });
  });

  describe('findOne', () => {
    it('should return the animal with relations when found by id', async () => {
      const id = 1;
      const animalWithRelations = {
        ...mockAnimal,
        healthRecords: [{ id: 1, checkDate: new Date() }],
        feedingRecords: [{ id: 1, feedTime: new Date() }],
        experimentAnimals: [{ id: 1, experimentId: 1 }],
      };

      repository.findOne.mockResolvedValue(animalWithRelations);

      const result = await service.findOne(id);

      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['healthRecords', 'feedingRecords', 'experimentAnimals'],
      });
      expect(result).toEqual(animalWithRelations);
    });

    it('should throw NotFoundException when animal does not exist', async () => {
      const id = 999;
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(id)).rejects.toThrow(`动物 #${id} 不存在`);
    });
  });

  describe('update', () => {
    it('should update an animal successfully (find -> merge -> save)', async () => {
      const id = 1;
      const updateDto: UpdateAnimalDto = { name: 'M-001-Updated', status: 'sick' };
      const updatedAnimal = { ...mockAnimal, ...updateDto };

      repository.findOne.mockResolvedValue(mockAnimal);
      repository.save.mockResolvedValue(updatedAnimal);

      const result = await service.update(id, updateDto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['healthRecords', 'feedingRecords', 'experimentAnimals'],
      });
      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(repository.save).toHaveBeenCalledWith(expect.objectContaining(updateDto));
      expect(result).toEqual(updatedAnimal);
    });

    it('should throw NotFoundException when updating non-existent animal', async () => {
      const id = 999;
      const updateDto: UpdateAnimalDto = { name: 'New Name' };

      repository.findOne.mockResolvedValue(null);

      await expect(service.update(id, updateDto)).rejects.toThrow(NotFoundException);
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove an animal successfully', async () => {
      const id = 1;

      repository.findOne.mockResolvedValue(mockAnimal);
      repository.remove.mockResolvedValue(mockAnimal);

      const result = await service.remove(id);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['healthRecords', 'feedingRecords', 'experimentAnimals'],
      });
      expect(repository.remove).toHaveBeenCalledTimes(1);
      expect(repository.remove).toHaveBeenCalledWith(mockAnimal);
      expect(result).toBeUndefined();
    });

    it('should throw NotFoundException when removing non-existent animal', async () => {
      const id = 999;

      repository.findOne.mockResolvedValue(null);

      await expect(service.remove(id)).rejects.toThrow(NotFoundException);
      expect(repository.remove).not.toHaveBeenCalled();
    });
  });

  describe('getSpeciesList', () => {
    it('should return distinct species list using query builder', async () => {
      const mockSpecies = [
        { species: '小鼠' },
        { species: '大鼠' },
        { species: '兔子' },
      ];

      (queryBuilder.getRawMany as jest.Mock).mockResolvedValue(mockSpecies);

      const result = await service.getSpeciesList();

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('animal');
      expect(queryBuilder.select).toHaveBeenCalledWith('DISTINCT animal.species', 'species');
      expect(queryBuilder.getRawMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual(['小鼠', '大鼠', '兔子']);
    });
  });

  describe('count', () => {
    it('should return total animal count', async () => {
      const mockCount = 42;
      repository.count.mockResolvedValue(mockCount);

      const result = await service.count();

      expect(repository.count).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockCount);
    });
  });

  describe('countByStatus', () => {
    it('should return count grouped by status using query builder', async () => {
      const mockData = [
        { status: 'healthy', count: 30 },
        { status: 'sick', count: 8 },
        { status: 'in_experiment', count: 4 },
      ];

      (queryBuilder.getRawMany as jest.Mock).mockResolvedValue(mockData);

      const result = await service.countByStatus();

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('animal');
      expect(queryBuilder.select).toHaveBeenCalledWith('animal.status', 'status');
      expect(queryBuilder.addSelect).toHaveBeenCalledWith('COUNT(*)', 'count');
      expect(queryBuilder.groupBy).toHaveBeenCalledWith('animal.status');
      expect(queryBuilder.getRawMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockData);
    });
  });

  describe('countBySpecies', () => {
    it('should return count grouped by species using query builder', async () => {
      const mockData = [
        { species: '小鼠', count: 25 },
        { species: '大鼠', count: 12 },
        { species: '兔子', count: 5 },
      ];

      (queryBuilder.getRawMany as jest.Mock).mockResolvedValue(mockData);

      const result = await service.countBySpecies();

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('animal');
      expect(queryBuilder.select).toHaveBeenCalledWith('animal.species', 'species');
      expect(queryBuilder.addSelect).toHaveBeenCalledWith('COUNT(*)', 'count');
      expect(queryBuilder.groupBy).toHaveBeenCalledWith('animal.species');
      expect(queryBuilder.getRawMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockData);
    });
  });
});

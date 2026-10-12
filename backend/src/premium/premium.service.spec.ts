import { Test, TestingModule } from '@nestjs/testing';
import { PremiumService } from './premium.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PremiumService', () => {
  let service: PremiumService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PremiumService,
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<PremiumService>(PremiumService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

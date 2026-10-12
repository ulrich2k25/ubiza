import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const testDatabaseUrl = 'postgresql://test:test@localhost:5432/ubiza_test';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) =>
              key === 'DATABASE_URL' ? testDatabaseUrl : undefined,
            ),
            getOrThrow: jest.fn((key: string) => {
              if (key === 'DATABASE_URL') {
                return testDatabaseUrl;
              }
              throw new Error(`Missing configuration: ${key}`);
            }),
          },
        },
      ],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

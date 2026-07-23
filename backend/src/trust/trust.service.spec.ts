import { Test, TestingModule } from '@nestjs/testing';
import { TrustService } from './trust.service';

describe('TrustService', () => {
  let service: TrustService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TrustService],
    }).compile();

    service = module.get<TrustService>(TrustService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { BoostsService } from './boosts.service';

describe('BoostsService', () => {
  let service: BoostsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BoostsService],
    }).compile();

    service = module.get<BoostsService>(BoostsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

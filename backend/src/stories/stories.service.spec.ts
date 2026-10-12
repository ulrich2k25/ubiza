import { Test, TestingModule } from '@nestjs/testing';
import { StoriesService } from './stories.service';

describe('StoriesService', () => {
  let service: StoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StoriesService],
    }).useMocker(() => ({})).compile();

    service = module.get<StoriesService>(StoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

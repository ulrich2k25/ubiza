import { Test, TestingModule } from '@nestjs/testing';
import { BoostsController } from './boosts.controller';
import { BoostsService } from './boosts.service';

describe('BoostsController', () => {
  let controller: BoostsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BoostsController],
      providers: [BoostsService],
    }).compile();

    controller = module.get<BoostsController>(BoostsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

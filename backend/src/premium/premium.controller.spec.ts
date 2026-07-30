import { Test, TestingModule } from '@nestjs/testing';
import { PremiumController } from './premium.controller';

describe('PremiumController', () => {
  let controller: PremiumController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PremiumController],
    }).compile();

    controller = module.get<PremiumController>(PremiumController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

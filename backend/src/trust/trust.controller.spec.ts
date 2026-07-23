import { Test, TestingModule } from '@nestjs/testing';
import { TrustController } from './trust.controller';

describe('TrustController', () => {
  let controller: TrustController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TrustController],
    }).compile();

    controller = module.get<TrustController>(TrustController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

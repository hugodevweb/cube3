import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('healthCheck', () => {
    it('doit retourner { status: "ok" }', () => {
      expect(appController.healthCheck()).toEqual({ status: 'ok' });
      // DEMO — uncomment to make the quality gate fail:
      // expect(appController.healthCheck()).toEqual({ status: 'error' }) ;
    });
  });
});

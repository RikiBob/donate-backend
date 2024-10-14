import { WayforpayController } from '../wayforpay.controller';
import { WayforpayService } from '../wayforpay.service';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WayforpayEntity } from '../../../entitties/wayforpay.entity';
import { ConfigModule } from '@nestjs/config';
import { Response } from 'express';
import { RequestWithUser } from '../../auth/strategies/jwt.strategy';
import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { SaveWayForPayDto } from '../dtos/save-wayforpay.dto';

describe('WayforpayController', () => {
  let controller: WayforpayController;
  let service: WayforpayService;

  const mockRepository = {
    find: jest.fn(),
    create: jest.fn(),
    findOneBy: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      controllers: [WayforpayController],
      providers: [
        WayforpayService,
        {
          provide: getRepositoryToken(WayforpayEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    controller = module.get<WayforpayController>(WayforpayController);
    service = module.get<WayforpayService>(WayforpayService);
  });

  it('should be defined service', () => {
    expect(service).toBeDefined();
  });

  it('should be defined controller', () => {
    expect(controller).toBeDefined();
  });

  describe('sendPaymentRequest', () => {
    it('should send a payment request and redirect', async () => {
      const response = {
        request: {
          res: {
            responseUrl: 'https://example.com/payment-response',
          },
        },
      };

      const data = {
        merchantFirstName: 'sample name',
        merchantEmail: 'sample@email.com',
        merchantPhone: '+380991234567',
        merchantAccount: 'test_merch_n1',
        merchantDomainName: 'www.market.ua',
        language: 'AUTO',
        currency: 'UAH',
        amount: '1',
        productCount: '1',
        productPrice: '1',
        orderReference: 'sample order reference',
        orderDate: '1415379863',
        merchantSignature: '905f9bbadefd9063f6537810d7b52631',
      };

      const sendPaymentRequest = jest
        .spyOn(service, 'sendPaymentRequest')
        .mockResolvedValue(response);

      jest.spyOn(service, 'checkInfoPayAndCreate').mockResolvedValue(undefined);

      const req: Partial<RequestWithUser> = {
        user: {
          uuid: 'user-uuid',
        },
      };

      const res: Partial<Response> = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await controller.sendPaymentRequest(
        req as RequestWithUser,
        res as Response,
        data,
      );

      expect(sendPaymentRequest).toHaveBeenCalledWith(data);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        redirectURL: response.request.res.responseUrl,
      });
    });

    it('should throw HttpException Failed to send payment request', async () => {
      const data = {
        merchantFirstName: 'sample name',
        merchantEmail: 'sample@email.com',
        merchantPhone: '+380991234567',
        merchantAccount: 'test_merch_n1',
        merchantDomainName: 'www.market.ua',
        language: 'AUTO',
        currency: 'UAH',
        amount: '1',
        productCount: '1',
        productPrice: '1',
        orderReference: 'sample order reference',
        orderDate: '1415379863',
        merchantSignature: '905f9bbadefd9063f6537810d7b52631',
      };

      const req: Partial<RequestWithUser> = {
        user: {
          uuid: 'user-uuid',
        },
      };

      const res: Partial<Response> = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      jest.spyOn(service, 'checkInfoPayAndCreate').mockResolvedValue(undefined);
      jest
        .spyOn(service, 'sendPaymentRequest')
        .mockResolvedValue(
          new BadRequestException('Failed to send payment request.'),
        );

      await expect(
        controller.sendPaymentRequest(
          req as RequestWithUser,
          res as Response,
          data,
        ),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('successfulPaymentRedirect', () => {
    it('should redirect to successful payment URL', async () => {
      const res: Partial<Response> = {
        redirect: jest.fn(),
      };

      const url = process.env.WAYFORPAY_APPROVED_REDIRECT_URL;

      controller.successfulPaymentRedirect(res as Response);

      expect(res.redirect).toHaveBeenCalledWith(url);
    });
  });

  describe('unsuccessfulPaymentRedirect', () => {
    it('should redirect to unsuccessful payment URL', async () => {
      const res: Partial<Response> = {
        redirect: jest.fn(),
      };

      const url = process.env.WAYFORPAY_DECLINED_REDIRECT_URL;

      controller.unsuccessfulPaymentRedirect(res as Response);

      expect(res.redirect).toHaveBeenCalledWith(url);
    });
  });

  describe('saveWayforpayUser', () => {
    it('should return Save data for WayForPay', async () => {
      const data: SaveWayForPayDto = {
        merchantAccount: 'merchantAccount',
        merchantSecret: 'merchantSecret',
      };

      const req: Partial<RequestWithUser> = {
        user: {
          uuid: 'user-uuid',
        },
      };

      const saveWayForPay = jest
        .spyOn(service, 'saveWayforpayUser')
        .mockResolvedValue('Save data for WayForPay');

      await controller.saveWayforpayUser(data, req as RequestWithUser);

      expect(saveWayForPay).toHaveBeenCalledWith(data, req as RequestWithUser);
    });
  });

  describe('deleteInfoPay', () => {
    it('should return http status Ok', async () => {
      const userId = 'user-uuid';
      const req: Partial<RequestWithUser> = {
        user: {
          uuid: 'user-uuid',
        },
      };

      const res: Partial<Response> = {
        sendStatus: jest.fn().mockReturnThis(),
      };

      const deleteInfoPay = jest
        .spyOn(service, 'deleteInfoPay')
        .mockResolvedValue(undefined);

      await controller.deleteInfoPay(
        userId,
        req as RequestWithUser,
        res as Response,
      );

      expect(deleteInfoPay).toHaveBeenCalledWith(userId, req.user.uuid);

      expect(res.sendStatus).toHaveBeenCalledWith(HttpStatus.OK);
    });
  });

  describe('transactionList', () => {
    it('should return transactions list for WayForPay', async () => {
      const list = [];

      const req: Partial<RequestWithUser> = {
        user: {
          uuid: 'user-uuid',
        },
      };

      const res: Partial<Response> = {
        send: jest.fn().mockReturnThis(),
      };

      const data = {
        dateBegin: 11111111,
        dateEnd: 111111111,
      };

      const checkInfoPayAndCreate = jest
        .spyOn(service, 'checkInfoPayAndCreate')
        .mockResolvedValue(undefined);
      const transactionList = jest
        .spyOn(service, 'transactionList')
        .mockResolvedValue(list);

      await controller.transactionList(
        req as RequestWithUser,
        res as Response,
        data,
      );

      expect(transactionList).toHaveBeenCalledWith(data);
      expect(checkInfoPayAndCreate).toHaveBeenCalledWith(req.user.uuid);
      expect(res.send).toHaveBeenCalledWith(list);
    });
  });
});

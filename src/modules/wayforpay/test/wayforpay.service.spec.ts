import { WayforpayService } from '../wayforpay.service';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WayforpayEntity } from '../../../entitties/wayforpay.entity';
import axios, { AxiosResponse } from 'axios';
import { SaveWayForPayDto } from '../dtos/save-wayforpay.dto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

describe('WayforpayService', () => {
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
      providers: [
        WayforpayService,
        ConfigService,
        {
          provide: getRepositoryToken(WayforpayEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<WayforpayService>(WayforpayService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateOrderReference', () => {
    it('should generate a valid order reference', () => {
      const data = { productName: 'SampleProduct' };
      const result = service.generateOrderReference(data);
      const expectedRegex = new RegExp(`^SampleProduct-\\d{14}-\\w{4}$`);
      expect(result).toMatch(expectedRegex);
    });
  });

  describe('generateOrderDate', () => {
    it('should generate a valid order date', () => {
      const result = service.generateOrderDate();
      const currentTimestamp = String(Math.floor(Date.now() / 1000));
      expect(result).toBe(currentTimestamp);
    });
  });

  describe('generateOrderSignature', () => {
    it('should generate a valid order signature', () => {
      const data = { productName: 'SampleProduct', amount: 100 };
      const result = service.generateOrderSignature(data);
      expect(result).toBeTruthy();
    });
  });

  describe('sendPaymentRequest', () => {
    it('should send a payment request successfully', async () => {
      const data = { productName: 'SampleProduct', amount: 100 };
      const responseMock: AxiosResponse = {
        data: 'sample-response-data',
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {
          headers: undefined,
        },
      };

      jest.spyOn(axios, 'post').mockResolvedValue(responseMock);

      const result = await service.sendPaymentRequest(data);
      expect(result).toEqual(responseMock);
    });

    it('BadRequestException Failed to send payment request.', async () => {
      const data = { productName: 'SampleProduct', amount: 100 };

      const responseMock: AxiosResponse = {
        data: 'sample-response-data',
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: {
          headers: undefined,
        },
      };

      jest.spyOn(axios, 'post').mockRejectedValue(responseMock);

      await expect(service.sendPaymentRequest(data)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('saveWayforpayUser', () => {
    it('should save the information successfully', async () => {
      const data: SaveWayForPayDto = {
        merchantAccount: 'merchantAccount',
        merchantSecret: 'merchantSecret',
      };
      const req = {
        user: { uuid: 'user-uuid' },
        get: jest.fn(),
        header: jest.fn(),
        accepts: jest.fn(),
      } as any; // мокаємо req
      const savedData = { ...data, user_id: req.user.uuid };

      jest.spyOn(mockRepository, 'findOneBy').mockResolvedValue(null);
      jest.spyOn(mockRepository, 'create').mockReturnValue(savedData);
      jest.spyOn(mockRepository, 'save').mockResolvedValue(savedData);

      const result = await service.saveWayforpayUser(data, req);

      expect(result).toBe('Save data for WayForPay');
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({
        user_id: req.user.uuid,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(savedData);
    });

    it('should throw ConflictException if payment data already exists', async () => {
      const data: SaveWayForPayDto = {
        merchantAccount: 'merchantAccount',
        merchantSecret: 'merchantSecret',
      };
      const req = {
        user: { uuid: 'user-uuid' },
        get: jest.fn(),
        header: jest.fn(),
        accepts: jest.fn(),
      } as any;

      jest.spyOn(mockRepository, 'findOneBy').mockResolvedValue({});

      await expect(service.saveWayforpayUser(data, req)).rejects.toThrow(
        ConflictException,
      );
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({
        user_id: req.user.uuid,
      });
    });
  });

  describe('deleteInfoPay', () => {
    it('should delete the information with DB', async () => {
      const userId = 'user-uuid';
      const currentUser = 'user-uuid';

      jest.spyOn(mockRepository, 'delete').mockResolvedValue({});
      jest
        .spyOn(mockRepository, 'findOneBy')
        .mockResolvedValue({ user_id: userId });

      await service.deleteInfoPay(userId, currentUser);
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({
        user_id: userId,
      });
      expect(mockRepository.delete).toHaveBeenCalledWith({ user_id: userId });
    });

    it('should throw NotFoundException User with ID ${userId} not found info pay', async () => {
      const userId = 'user-uuid';
      const currentUser = 'user-uuid';

      jest.spyOn(mockRepository, 'findOneBy').mockResolvedValue(null);

      await expect(service.deleteInfoPay(userId, currentUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException You do not have permission to access info pay.', async () => {
      const userId = 'user-uuid';
      const currentUser = ' ';

      jest.spyOn(mockRepository, 'findOneBy').mockResolvedValue({});

      await expect(service.deleteInfoPay(userId, currentUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('checkInfoPayAndCreate', () => {
    it('should set value merchantAccount and merchantSecret', async () => {
      const userId = 'user-uuid';

      jest.spyOn(mockRepository, 'findOneBy').mockResolvedValue({
        decrypt: (merchantSecret) => {
          return merchantSecret;
        },
        merchantAccount: 'merchantAccount',
        merchantSecret: 'merchantSecret',
      });

      await service.checkInfoPayAndCreate(userId);

      expect(service.merchantAccount).toBe('merchantAccount');
      expect(service.merchantSecret).toBe('merchantSecret');
    });

    it('should throw NotFoundException User with ID ${userId} not found info pay', async () => {
      const userId = 'user-uuid';

      jest.spyOn(mockRepository, 'findOneBy').mockResolvedValue(null);

      await expect(service.checkInfoPayAndCreate(userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException User with ID ${userId} not found info pay', async () => {
      const userId = 'user-uuid';

      jest.spyOn(mockRepository, 'findOneBy').mockResolvedValue({
        decrypt: (merchantSecret) => {
          return merchantSecret;
        },
        merchantSecret: null,
      });

      await expect(service.checkInfoPayAndCreate(userId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('generateTransactionSignature', () => {
    it('should generate a valid order signature', () => {
      const data = { productName: 'SampleProduct', amount: 100 };
      const result = service.generateOrderSignature(data);
      expect(result).toBeTruthy();
    });
  });

  describe('transactionList', () => {
    it('should send a payment request successfully', async () => {
      const data = { dateBegin: 1728518400000, dateEnd: 1727731200000 };
      const responseMock: AxiosResponse = {
        data: {
          transactionList: [],
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {
          headers: undefined,
        },
      };

      jest.spyOn(axios, 'post').mockResolvedValue(responseMock);

      const result = await service.transactionList(data);
      expect(result).toEqual(responseMock.data.transactionList);
    });

    it('should throw BadRequestException Failed to send transaction list request.', async () => {
      const data = {};

      const responseMock: AxiosResponse = {
        data: {
          data: 'sample-response-data',
        },
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: {
          headers: undefined,
        },
      };

      jest.spyOn(axios, 'post').mockRejectedValue(responseMock);

      await expect(service.transactionList(data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException Dates exceed 31 days', async () => {
      const data = { dateBegin: 1727731200000, dateEnd: 1730582400000 };

      await expect(service.transactionList(data)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});

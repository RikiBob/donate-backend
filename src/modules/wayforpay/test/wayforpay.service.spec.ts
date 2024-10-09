import { WayforpayService } from '../wayforpay.service';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WayforpayEntity } from '../../../entitties/wayforpay.entity';
import axios, { AxiosResponse } from 'axios';
import { SaveWayForPayDto } from '../dtos/save-wayforpay.dto';
import { ConflictException } from '@nestjs/common';

describe('WayforpayService', () => {
  let service: WayforpayService;
  // let configService: ConfigService;

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
    // configService = module.get<ConfigService>(ConfigService);
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

    it('should throw an error if sending payment request fails', async () => {
      const data = { productName: 'SampleProduct', amount: 100 };

      jest
        .spyOn(axios, 'post')
        .mockRejectedValue(new Error('Failed to send payment request.'));

      await expect(service.sendPaymentRequest(data)).rejects.toThrowError(
        'Failed to send payment request.',
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
});

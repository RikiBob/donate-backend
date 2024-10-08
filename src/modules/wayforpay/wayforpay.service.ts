import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { v4 as uuid } from 'uuid';
import { createHmac } from 'node:crypto';
import { SaveWayForPayDto } from './dtos/save-wayforpay.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { WayforpayEntity } from '../../entitties/wayforpay.entity';
import { Repository } from 'typeorm';
import { RequestWithUser } from '../auth/strategies/jwt.strategy';

@Injectable()
export class WayforpayService {
  private readonly logger = new Logger(WayforpayService.name);
  merchantAccount: any;
  merchantSecret: any;
  orderReference: any;
  orderDate: any;
  language = 'AUTO';
  currency = 'UAH';
  productCount = '1';

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(WayforpayEntity)
    private readonly wayforpayRepository: Repository<WayforpayEntity>,
  ) {}
  async sendPaymentRequest(data: any): Promise<any> {
    const url = this.configService.get('WAYFORPAY_PAYMENT_URL');
    const responseData = {
      merchantAccount: this.merchantAccount,
      merchantDomainName: this.configService.get(
        'WAYFORPAY_MERCHANT_DOMAIN_NAME',
      ),
      language: this.language,
      currency: this.currency,
      amount: data.amount,
      productCount: this.productCount,
      productPrice: data.amount,
      orderReference: this.generateOrderReference(data),
      orderDate: this.generateOrderDate(),
      merchantSignature: this.generateOrderSignature(data),
      approvedUrl: this.configService.get('WAYFORPAY_APPROVED_URL'),
      declinedUrl: this.configService.get('WAYFORPAY_DECLINED_URL'),
      ...data,
    };

    const config = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
    };

    this.merchantAccount = null;
    this.merchantSecret = null;

    try {
      this.logger.log('Request for payment formation');
      return await axios.post(url, responseData, config);
    } catch (error) {
      this.logger.error('Failed to send payment request.');
      throw new BadRequestException('Failed to send payment request.');
    }
  }

  generateOrderReference(data: any): string {
    const formattedDate = new Date()
      .toISOString()
      .replace(/[-:.T]/g, '')
      .slice(0, 14);

    const randomString = uuid().substring(0, 4);

    const orderReference = `${data.productName}-${formattedDate}-${randomString}`;
    this.orderReference = orderReference;

    return orderReference;
  }

  generateOrderDate(): string {
    const orderDate = Math.floor(Date.now() / 1000);
    this.orderDate = orderDate;
    return orderDate.toString();
  }

  generateOrderSignature(data: any): string {
    const fieldsForSignature = {
      merchantAccount: this.merchantAccount,
      merchantDomainName: this.configService.get(
        'WAYFORPAY_MERCHANT_DOMAIN_NAME',
      ),
      orderReference: this.orderReference,
      orderDate: this.orderDate,
      amount: data.amount,
      currency: this.currency,
      productName: data.productName,
      productCount: this.productCount,
      productPrice: data.amount,
    };

    const signatureString = Object.values(fieldsForSignature)
      .map((value) => {
        if (Array.isArray(value)) {
          return value.join(';');
        }
        return value;
      })
      .join(';');

    this.orderReference = null;
    this.orderDate = null;

    return createHmac('md5', this.merchantSecret)
      .update(signatureString, 'utf-8')
      .digest('hex');
  }

  async saveWayforpayUser(
    data: SaveWayForPayDto,
    req: RequestWithUser,
  ): Promise<string> {
    const userId = await this.wayforpayRepository.findOneBy({
      user_id: req.user.uuid,
    });
    if (userId) {
      this.logger.error('Payment information already exists for this user');
      throw new ConflictException(
        'Payment information already exists for this user.',
      );
    }
    const dataForPayments = this.wayforpayRepository.create({
      ...data,
      user_id: req.user.uuid,
    });
    await this.wayforpayRepository.save(dataForPayments);
    this.logger.log('Save data for WayForPay');
    return 'Save data for WayForPay';
  }

  async deleteInfoPay(userId: string, currentUserId: string): Promise<void> {
    const infoPay = await this.wayforpayRepository.findOneBy({
      user_id: userId,
    });
    if (!infoPay) {
      this.logger.error(`User with ID ${userId} not found info pay`);
      throw new NotFoundException(`User with ID ${userId} not found info pay`);
    }
    if (currentUserId !== infoPay.user_id) {
      this.logger.error('You do not have permission to access info pay.');
      throw new ForbiddenException(
        'You do not have permission to access info pay.',
      );
    }
    await this.wayforpayRepository.delete({ user_id: userId });
    this.logger.log('User is deleted successfully.');
  }

  async checkInfoPayAndCreate(userId: string): Promise<void> {
    const infoPay = await this.wayforpayRepository.findOneBy({
      user_id: userId,
    });

    if (!infoPay) {
      this.logger.error(`User with ID ${userId} not found info pay`);
      throw new NotFoundException(`User with ID ${userId} not found info pay`);
    }

    const existingPay = infoPay.decrypt(infoPay.merchantSecret);
    if (!existingPay) {
      this.logger.error(`User with ID ${userId} not found info pay`);
      throw new ForbiddenException(`User with ID ${userId} not found info pay`);
    }

    this.merchantAccount = infoPay.merchantAccount;
    this.merchantSecret = existingPay;
  }

  generateTransactionSignature(data: any): string {
    const fieldsForSignature = {
      merchantAccount: this.merchantAccount,
      dateBegin: data.dateBegin,
      dateEnd: data.dateEnd,
    };

    const signatureString = Object.values(fieldsForSignature)
      .map((value) => {
        if (Array.isArray(value)) {
          return value.join(';');
        }
        return value;
      })
      .join(';');

    return createHmac('md5', this.merchantSecret)
      .update(signatureString, 'utf-8')
      .digest('hex');
  }

  async transactionList(data: any): Promise<any> {
    this.checkDateValidate(data);
    const url = this.configService.get('WAYFORPAY_TRANSACTION_LIST_URL');
    const responseData = {
      apiVersion: 1,
      transactionType: 'TRANSACTION_LIST',
      merchantAccount: this.merchantAccount,
      merchantSignature: this.generateTransactionSignature(data),
      dateBegin: data.dateBegin,
      dateEnd: data.dateEnd,
    };

    const config = {
      headers: {
        'Content-Type': 'application/json', // Налаштовуємо заголовок для JSON
      },
    };

    this.merchantAccount = null;
    this.merchantSecret = null;

    try {
      this.logger.log('Request list of transactions');
      return await axios
        .post(url, JSON.stringify(responseData), config)
        .then((response) => {
          return response.data.transactionList;
        });
    } catch (error) {
      this.logger.error('Failed to send transaction list request.');
      throw new BadRequestException('Failed to send transaction list request.');
    }
  }

  private checkDateValidate(data): void {
    const oneDayInMs = 24 * 60 * 60 * 1000;
    const differenceInMs = (data.dateEnd - data.dateBegin) / oneDayInMs;
    if (differenceInMs > 31) {
      this.logger.error('Dates exceed 31 days');
      throw new BadRequestException('Dates exceed 31 days');
    }
  }
}

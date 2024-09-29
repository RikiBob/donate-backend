import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { v4 as uuid } from 'uuid';
import { createHmac } from 'node:crypto';

@Injectable()
export class WayforpayService {
  orderReference: any;
  orderDate: any;
  language = 'AUTO';
  currency = 'UAH';
  productCount = '1';

  constructor(private readonly configService: ConfigService) {}
  async sendPaymentRequest(data: any): Promise<any> {
    const url = this.configService.get('WAYFORPAY_PAYMENT_URL');
    const responseData = {
      merchantAccount: this.configService.get('WAYFORPAY_MERCHANT_ACCOUNT'),
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

    try {
      return await axios.post(url, responseData, config);
    } catch (error) {
      throw new Error('Failed to send payment request.');
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
      merchantAccount: this.configService.get('WAYFORPAY_MERCHANT_ACCOUNT'),
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

    return createHmac(
      'md5',
      this.configService.get('WAYFORPAY_MERCHANT_SECRET'),
    )
      .update(signatureString, 'utf-8')
      .digest('hex');
  }
}

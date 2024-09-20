import { IsEnum } from 'class-validator';
import { ROLES } from '../enums/user.roles';

export class UpdateUserDto {
  firstName: string;

  lastName: string;

  picture: string;

  @IsEnum(ROLES)
  role: string = ROLES.COMPANY || ROLES.DONOR;

  birthday: Date;

  city: string;

  country: string;
}

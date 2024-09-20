import { UpdateUserDto } from './update-user.dto';

export class UserProfileDto extends UpdateUserDto {
  uuid: string;

  email: string;
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../../entitties/user.entity';
import { Repository } from 'typeorm';
import { UserProfileDto } from './dtos/user-profile.dto';
import { UpdateUserDto } from './dtos/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
  ) {}

  async findAll() {
    return await this.usersRepository.find();
  }

  async getById(uuid: string): Promise<UserProfileDto> {
    const user = await this.usersRepository.findOneBy({ uuid });
    delete user.password;
    return user;
  }

  async updateUser(uuid: string, data: UpdateUserDto): Promise<UserProfileDto> {
    uuid = uuid.replace(/^:/, '');
    await this.usersRepository.update({ uuid }, data);
    const user = await this.usersRepository.findOneBy({ uuid });
    delete user.password;
    return user;
  }
}

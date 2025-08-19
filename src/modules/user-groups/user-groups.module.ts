import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserGroupsService } from './user-groups.service';
import { UserGroupsController } from './user-groups.controller';
import { UserGroup } from '../../entities/user-group.entity';
import { User } from '../../entities/user.entity';
import { MyProject } from '../../entities/my-project.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserGroup, User, MyProject])],
  controllers: [UserGroupsController],
  providers: [UserGroupsService],
  exports: [UserGroupsService],
})
export class UserGroupsModule {}
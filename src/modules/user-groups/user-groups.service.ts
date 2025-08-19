import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserGroup } from '../../entities/user-group.entity';
import { User } from '../../entities/user.entity';
import { MyProject } from '../../entities/my-project.entity';
import { CreateUserGroupDto } from './dto/create-user-group.dto';
import { UpdateUserGroupDto } from './dto/update-user-group.dto';
import { AddMembersDto } from './dto/add-members.dto';

@Injectable()
export class UserGroupsService {
  constructor(
    @InjectRepository(UserGroup)
    private userGroupRepository: Repository<UserGroup>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(MyProject)
    private myProjectRepository: Repository<MyProject>,
  ) {}

  async create(createUserGroupDto: CreateUserGroupDto, createdById: number): Promise<UserGroup> {
    const { memberIds, ...groupData } = createUserGroupDto;
    
    const userGroup = this.userGroupRepository.create({
      ...groupData,
      createdById,
    });

    const savedGroup = await this.userGroupRepository.save(userGroup);

    // Add members if provided
    if (memberIds && memberIds.length > 0) {
      await this.addMembers(savedGroup.id, { userIds: memberIds }, createdById);
    }

    return this.findOne(savedGroup.id);
  }

  async findAll(createdById?: number): Promise<UserGroup[]> {
    const queryBuilder = this.userGroupRepository
      .createQueryBuilder('userGroup')
      .leftJoinAndSelect('userGroup.createdBy', 'createdBy')
      .leftJoinAndSelect('userGroup.members', 'members')
      .leftJoinAndSelect('userGroup.project', 'project')
      .orderBy('userGroup.createdAt', 'DESC');

    if (createdById) {
      queryBuilder.where('userGroup.createdById = :createdById', { createdById });
    }

    return queryBuilder.getMany();
  }

  async findOne(id: number): Promise<UserGroup> {
    const userGroup = await this.userGroupRepository
      .createQueryBuilder('userGroup')
      .leftJoinAndSelect('userGroup.createdBy', 'createdBy')
      .leftJoinAndSelect('userGroup.members', 'members')
      .leftJoinAndSelect('userGroup.project', 'project')
      .where('userGroup.id = :id', { id })
      .getOne();

    if (!userGroup) {
      throw new NotFoundException('User group not found');
    }

    return userGroup;
  }

  async update(id: number, updateUserGroupDto: UpdateUserGroupDto, userId: number): Promise<UserGroup> {
    const userGroup = await this.findOne(id);

    // Check if user has permission to update (owner or system admin)
    if (userGroup.createdById !== userId) {
      throw new ForbiddenException('You do not have permission to update this group');
    }

    // Prevent updating system groups
    if (userGroup.isSystem) {
      throw new ForbiddenException('Cannot update system groups');
    }

    await this.userGroupRepository.update(id, updateUserGroupDto);
    return this.findOne(id);
  }

  async remove(id: number, userId: number): Promise<void> {
    const userGroup = await this.findOne(id);

    // Check if user has permission to delete (owner or system admin)
    if (userGroup.createdById !== userId) {
      throw new ForbiddenException('You do not have permission to delete this group');
    }

    // Prevent deleting system groups
    if (userGroup.isSystem) {
      throw new ForbiddenException('Cannot delete system groups');
    }

    await this.userGroupRepository.remove(userGroup);
  }

  async addMembers(id: number, addMembersDto: AddMembersDto, userId: number): Promise<UserGroup> {
    const userGroup = await this.findOne(id);

    // Check if user has permission to add members
    if (userGroup.createdById !== userId) {
      throw new ForbiddenException('You do not have permission to add members to this group');
    }

    const users = await this.userRepository.findByIds(addMembersDto.userIds);
    
    if (users.length !== addMembersDto.userIds.length) {
      throw new NotFoundException('Some users not found');
    }

    // Add new members (avoid duplicates)
    const existingMemberIds = userGroup.members.map(member => member.id);
    const newMembers = users.filter(user => !existingMemberIds.includes(user.id));
    
    userGroup.members = [...userGroup.members, ...newMembers];
    await this.userGroupRepository.save(userGroup);

    return this.findOne(id);
  }

  async removeMembers(id: number, addMembersDto: AddMembersDto, userId: number): Promise<UserGroup> {
    const userGroup = await this.findOne(id);

    // Check if user has permission to remove members
    if (userGroup.createdById !== userId) {
      throw new ForbiddenException('You do not have permission to remove members from this group');
    }

    // Remove members
    userGroup.members = userGroup.members.filter(
      member => !addMembersDto.userIds.includes(member.id)
    );

    await this.userGroupRepository.save(userGroup);
    return this.findOne(id);
  }

  async getUserGroups(userId: number): Promise<UserGroup[]> {
    return this.userGroupRepository
      .createQueryBuilder('userGroup')
      .leftJoinAndSelect('userGroup.createdBy', 'createdBy')
      .leftJoinAndSelect('userGroup.members', 'members')
      .where('members.id = :userId', { userId })
      .orderBy('userGroup.name', 'ASC')
      .getMany();
  }

  async getGroupStats(createdById?: number): Promise<any> {
    const queryBuilder = this.userGroupRepository
      .createQueryBuilder('userGroup')
      .leftJoinAndSelect('userGroup.members', 'members');

    if (createdById) {
      queryBuilder.where('userGroup.createdById = :createdById', { createdById });
    }

    const groups = await queryBuilder.getMany();

    const stats = {
      totalGroups: groups.length,
      totalMembers: groups.reduce((sum, group) => sum + group.members.length, 0),
      byStatus: {} as any,
      averageMembersPerGroup: 0,
      topGroups: [] as any[],
    };

    // Calculate stats by status
    groups.forEach(group => {
      const status = group.status || 'active';
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
    });

    // Calculate average members per group
    if (groups.length > 0) {
      stats.averageMembersPerGroup = Math.round(stats.totalMembers / groups.length);
    }

    // Get top groups by member count
    stats.topGroups = groups
      .sort((a, b) => b.members.length - a.members.length)
      .slice(0, 5)
      .map(group => ({
        id: group.id,
        name: group.name,
        memberCount: group.members.length,
        status: group.status,
      }));

    return stats;
  }
}
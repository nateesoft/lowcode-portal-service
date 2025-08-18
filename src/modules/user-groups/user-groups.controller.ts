import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { UserGroupsService } from './user-groups.service';
import { CreateUserGroupDto } from './dto/create-user-group.dto';
import { UpdateUserGroupDto } from './dto/update-user-group.dto';
import { AddMembersDto } from './dto/add-members.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('user-groups')
@UseGuards(JwtAuthGuard)
export class UserGroupsController {
  constructor(private readonly userGroupsService: UserGroupsService) {}

  @Post()
  create(@Body() createUserGroupDto: CreateUserGroupDto, @Request() req) {
    const userId = req.user.id;
    return this.userGroupsService.create(createUserGroupDto, userId);
  }

  @Get()
  findAll(@Request() req, @Query('all') includeAll?: string) {
    const userId = req.user.id;
    // If 'all' query param is provided, return all groups, otherwise only user's groups
    return this.userGroupsService.findAll(includeAll === 'true' ? undefined : userId);
  }

  @Get('stats')
  getStats(@Request() req) {
    const userId = req.user.id;
    return this.userGroupsService.getGroupStats(userId);
  }

  @Get('my-groups')
  getUserGroups(@Request() req) {
    const userId = req.user.id;
    return this.userGroupsService.getUserGroups(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userGroupsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserGroupDto: UpdateUserGroupDto,
    @Request() req,
  ) {
    const userId = req.user.id;
    return this.userGroupsService.update(+id, updateUserGroupDto, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.userGroupsService.remove(+id, userId);
  }

  @Post(':id/members')
  addMembers(
    @Param('id') id: string,
    @Body() addMembersDto: AddMembersDto,
    @Request() req,
  ) {
    const userId = req.user.id;
    return this.userGroupsService.addMembers(+id, addMembersDto, userId);
  }

  @Delete(':id/members')
  removeMembers(
    @Param('id') id: string,
    @Body() addMembersDto: AddMembersDto,
    @Request() req,
  ) {
    const userId = req.user.id;
    return this.userGroupsService.removeMembers(+id, addMembersDto, userId);
  }
}
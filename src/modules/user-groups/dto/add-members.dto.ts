import { IsArray, IsNumber } from 'class-validator';

export class AddMembersDto {
  @IsArray()
  @IsNumber({}, { each: true })
  userIds: number[];
}
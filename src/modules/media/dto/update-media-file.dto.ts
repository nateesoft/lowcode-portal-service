import { PartialType } from '@nestjs/mapped-types';
import { CreateMediaFileDto } from './create-media-file.dto';

export class UpdateMediaFileDto extends PartialType(CreateMediaFileDto) {}
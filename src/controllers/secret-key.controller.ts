import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SecretKeyService } from '../services/secret-key.service';
import { CreateSecretKeyDto, UpdateSecretKeyDto, SecretKeyResponseDto, SecretKeyListResponseDto } from '../dto/secret-key.dto';
import { SecretKeyType } from '../entities/secret-key.entity';

@Controller('secret-keys')
export class SecretKeyController {
  constructor(private readonly secretKeyService: SecretKeyService) {}

  @Post()
  async create(
    @Body() createSecretKeyDto: CreateSecretKeyDto,
    @Request() req: any,
  ): Promise<SecretKeyResponseDto> {
    const userId = req.user?.id || 13;
    return this.secretKeyService.create(createSecretKeyDto, userId);
  }

  @Get()
  async findAll(
    @Request() req: any,
    @Query('type') type?: SecretKeyType,
    @Query('search') search?: string,
    @Query('expired') expired?: boolean,
    @Query('expiring_soon') expiringSoon?: boolean,
  ): Promise<SecretKeyListResponseDto[]> {
    const userId = req.user?.id || 13;

    if (expired) {
      return this.secretKeyService.findExpired(userId);
    }

    if (expiringSoon) {
      return this.secretKeyService.findExpiringSoon(userId);
    }

    if (search) {
      return this.secretKeyService.search(search, userId);
    }

    if (type) {
      return this.secretKeyService.findByType(type, userId);
    }

    return this.secretKeyService.findAll(userId);
  }

  @Get('expired')
  async findExpired(@Request() req: any): Promise<SecretKeyListResponseDto[]> {
    const userId = req.user?.id || 13;
    return this.secretKeyService.findExpired(userId);
  }

  @Get('expiring-soon')
  async findExpiringSoon(
    @Request() req: any,
    @Query('days', new ParseIntPipe({ optional: true })) days?: number,
  ): Promise<SecretKeyListResponseDto[]> {
    const userId = req.user?.id || 13;
    return this.secretKeyService.findExpiringSoon(userId, days);
  }

  @Get('search')
  async search(
    @Request() req: any,
    @Query('q') query: string,
  ): Promise<SecretKeyListResponseDto[]> {
    const userId = req.user?.id || 13;
    return this.secretKeyService.search(query, userId);
  }

  @Get('by-type/:type')
  async findByType(
    @Request() req: any,
    @Param('type') type: SecretKeyType,
  ): Promise<SecretKeyListResponseDto[]> {
    const userId = req.user?.id || 13;
    return this.secretKeyService.findByType(type, userId);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<SecretKeyResponseDto> {
    const userId = req.user?.id || 13;
    return this.secretKeyService.findOne(id, userId);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSecretKeyDto: UpdateSecretKeyDto,
    @Request() req: any,
  ): Promise<SecretKeyResponseDto> {
    const userId = req.user?.id || 13;
    return this.secretKeyService.update(id, updateSecretKeyDto, userId);
  }

  @Patch(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  async deactivate(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<SecretKeyResponseDto> {
    const userId = req.user?.id || 13;
    return this.secretKeyService.deactivate(id, userId);
  }

  @Patch(':id/activate')
  @HttpCode(HttpStatus.OK)
  async activate(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<SecretKeyResponseDto> {
    const userId = req.user?.id || 13;
    return this.secretKeyService.activate(id, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<void> {
    const userId = req.user?.id || 13;
    return this.secretKeyService.remove(id, userId);
  }
}
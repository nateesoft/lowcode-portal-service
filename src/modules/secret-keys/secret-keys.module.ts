import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { SecretKey } from '../../entities/secret-key.entity';
import { SecretKeyService } from '../../services/secret-key.service';
import { SecretKeyController } from '../../controllers/secret-key.controller';
import { VaultService } from '../../services/vault.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SecretKey]),
    ConfigModule,
  ],
  providers: [SecretKeyService, VaultService],
  controllers: [SecretKeyController],
  exports: [SecretKeyService, VaultService],
})
export class SecretKeysModule {}
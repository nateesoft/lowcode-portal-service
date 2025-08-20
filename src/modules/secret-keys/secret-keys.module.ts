import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SecretKey } from '../../entities/secret-key.entity';
import { SecretKeyService } from '../../services/secret-key.service';
import { SecretKeyController } from '../../controllers/secret-key.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SecretKey])],
  providers: [SecretKeyService],
  controllers: [SecretKeyController],
  exports: [SecretKeyService],
})
export class SecretKeysModule {}
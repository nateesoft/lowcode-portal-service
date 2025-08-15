import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Note } from '../../entities/note.entity';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note)
    private noteRepository: Repository<Note>,
  ) {}

  async create(createNoteDto: CreateNoteDto, userId: number): Promise<Note> {
    const note = this.noteRepository.create({
      ...createNoteDto,
      userId,
    });
    return await this.noteRepository.save(note);
  }

  async findAllByUser(userId: number): Promise<Note[]> {
    return await this.noteRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number, userId: number): Promise<Note | null> {
    return await this.noteRepository.findOne({
      where: { id, userId },
    });
  }

  async update(id: number, updateNoteDto: UpdateNoteDto, userId: number): Promise<Note | null> {
    const updateResult = await this.noteRepository.update({ id, userId }, updateNoteDto);
    if (updateResult.affected === 0) {
      return null;
    }
    return await this.findOne(id, userId);
  }

  async remove(id: number, userId: number): Promise<void> {
    await this.noteRepository.delete({ id, userId });
  }

  @Cron(CronExpression.EVERY_HOUR)
  async deleteExpiredNotes(): Promise<void> {
    const now = new Date();
    await this.noteRepository.delete({
      expiresAt: LessThan(now),
    });
  }
}
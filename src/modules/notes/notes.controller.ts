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
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  async create(@Body() createNoteDto: CreateNoteDto, @Request() req) {
    try {
      const userId = req.user?.userId || 1;
      console.log('Creating note:', createNoteDto, 'userId:', userId);
      const result = await this.notesService.create(createNoteDto, userId);
      console.log('Note created:', result);
      return result;
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  }

  @Get()
  findAll(@Request() req) {
    const userId = req.user?.userId || 1;
    return this.notesService.findAllByUser(userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const userId = req.user?.userId || 1;
    return this.notesService.findOne(id, userId);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNoteDto: UpdateNoteDto,
    @Request() req,
  ) {
    const userId = req.user?.userId || 1;
    const result = await this.notesService.update(id, updateNoteDto, userId);
    if (!result) {
      throw new NotFoundException('Note not found');
    }
    return result;
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const userId = req.user?.userId || 1;
    return this.notesService.remove(id, userId);
  }
}
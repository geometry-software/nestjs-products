import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CrudListQueryDto } from '../common/crud/crud.query.dto';
import { PaginatedResult } from '../common/crud/crud.types';
import { CreateUserDto, UpdateUserDto, UserOutDto, UserRole } from './dto/user.dto';
import { UsersService } from './users.service';

type UsersFindAllQuery = CrudListQueryDto & Record<string, string | string[]>;
type AuthUser = { userId: string; email: string; role: UserRole };

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() dto: CreateUserDto, @Req() req: { user: AuthUser }): Promise<UserOutDto> {
    if (req.user.role !== 'admin') {
      throw new UnauthorizedException('Only admin can create users');
    }

    return this.usersService.createByAdmin(dto);
  }

  @Get()
  async findAll(
    @Query() query: UsersFindAllQuery,
    @Req() req: { user: AuthUser },
  ): Promise<PaginatedResult<UserOutDto>> {
    if (req.user.role !== 'admin') {
      throw new UnauthorizedException('Only admin can list users');
    }

    return this.usersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: { user: AuthUser }): Promise<UserOutDto> {
    return this.usersService.findOneForActor(id, req.user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Req() req: { user: AuthUser },
  ): Promise<UserOutDto> {
    return this.usersService.updateForActor(id, dto, req.user);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: { user: AuthUser }): Promise<{ ok: true }> {
    if (req.user.role !== 'admin') {
      throw new UnauthorizedException('Only admin can delete users');
    }

    return this.usersService.removeForAdmin(id);
  }
}
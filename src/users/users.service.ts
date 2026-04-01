import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { CrudService } from '../common/crud/crud.service';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto, UpdateUserDto, UserOutDto, UserRole } from './dto/user.dto';

type AuthUser = {
  userId: string;
  email: string;
  role: UserRole;
};

@Injectable()
export class UsersService extends CrudService<
  UserDocument,
  CreateUserDto,
  UpdateUserDto,
  UserOutDto
> {
  constructor(@InjectModel(User.name) model: Model<UserDocument>) {
    super(model, {
      entityName: User.name,
      filterableFields: ['firstName', 'lastName', 'email', 'role', 'isActive', 'createdAt', 'updatedAt'],
      sortableFields: ['createdAt', 'updatedAt', 'firstName', 'lastName', 'email', 'role'],
      defaultSort: { createdAt: -1 },
      createDateField: 'createdAt',
      modifyDateField: 'updatedAt',
      dateRangeFields: ['createdAt'],
      searchableFields: ['firstName', 'lastName', 'email'],
    });
  }

  protected override mapDocToOut(doc: any): UserOutDto {
    return {
      id: String(doc._id),
      firstName: doc.firstName,
      lastName: doc.lastName,
      email: doc.email,
      role: doc.role,
      isActive: doc.isActive,
      createdAt: new Date(doc.createdAt).toISOString(),
      updatedAt: new Date(doc.updatedAt).toISOString(),
    };
  }

  async createByAdmin(dto: CreateUserDto): Promise<UserOutDto> {
    const email = dto.email.trim().toLowerCase();
    const exists = await this.model.exists({ email });

    if (exists) {
      throw new BadRequestException('Email already in use');
    }

    const now = new Date();
    const password = await bcrypt.hash(dto.password, this.getSaltRounds());

    const created = await this.model.create({
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      email,
      password,
      role: dto.role ?? 'user',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    const plain = created.toObject ? created.toObject() : created;
    return this.mapDocToOut(plain);
  }

  async findOneForActor(id: string, actor: AuthUser): Promise<UserOutDto> {
    this.assertObjectId(id);

    if (actor.role !== 'admin' && actor.userId !== id) {
      throw new ForbiddenException('You can only view your own user');
    }

    const doc = await this.model.findById(id).lean();

    if (!doc) {
      throw new NotFoundException(`${User.name} not found`);
    }

    return this.mapDocToOut(doc);
  }

  async updateForActor(id: string, dto: UpdateUserDto, actor: AuthUser): Promise<UserOutDto> {
    this.assertObjectId(id);

    const isAdmin = actor.role === 'admin';
    const isSelf = actor.userId === id;

    if (!isAdmin && !isSelf) {
      throw new ForbiddenException('You can only update your own user');
    }

    const next: Record<string, unknown> = {};

    if (typeof dto.firstName === 'string') next.firstName = dto.firstName.trim();
    if (typeof dto.lastName === 'string') next.lastName = dto.lastName.trim();

    if (typeof dto.email === 'string') {
      const email = dto.email.trim().toLowerCase();
      const existing = await this.model.findOne({ email, _id: { $ne: id } }).lean();

      if (existing) {
        throw new BadRequestException('Email already in use');
      }

      next.email = email;
    }

    if (typeof dto.password === 'string' && dto.password.trim()) {
      next.password = await bcrypt.hash(dto.password, this.getSaltRounds());
    }

    if (isAdmin) {
      if (dto.role) next.role = dto.role;
      if (typeof dto.isActive === 'boolean') next.isActive = dto.isActive;
    }

    next.updatedAt = new Date();

    const doc = await this.model.findByIdAndUpdate(id, next, { new: true }).lean();

    if (!doc) {
      throw new NotFoundException(`${User.name} not found`);
    }

    return this.mapDocToOut(doc);
  }

  async removeForAdmin(id: string): Promise<{ ok: true }> {
    return this.remove(id);
  }

  protected override assertObjectId(id: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`${User.name} not found`);
    }
  }

  private getSaltRounds(): number {
    const roundsEnv = process.env.BCRYPT_SALT ?? '10';
    const roundsParsed = parseInt(roundsEnv, 10);
    return Math.min(15, Math.max(4, Number.isFinite(roundsParsed) ? roundsParsed : 10));
  }
}
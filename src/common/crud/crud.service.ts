import { NotFoundException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { CrudFindAllQuery, PaginatedResult, SortDir, SortOrder } from './crud.types';

export type CrudOptions = {
  entityName: string;
  filterableFields?: string[];
  sortableFields?: string[];
  defaultSort?: Record<string, SortDir>;
  defaultLimit?: number;
  maxLimit?: number;
  createDateField?: string;
  modifyDateField?: string;
  dateRangeFields?: string[];
  searchableFields?: string[];
};

export class CrudService<
  TDoc extends { _id: any },
  TCreateDto = unknown,
  TUpdateDto = unknown,
  TOut = unknown
> {
  protected readonly entityName: string;
  protected readonly filterableFields: string[];
  protected readonly sortableFields: string[];
  protected readonly defaultSort: Record<string, SortDir>;
  protected readonly defaultLimit: number;
  protected readonly maxLimit: number;
  protected readonly createDateField: string | null;
  protected readonly modifyDateField: string | null;
  protected readonly dateRangeFields: string[];
  protected readonly searchableFields: string[];

  private readonly systemKeys = new Set(['page', 'limit', 'sortBy', 'sortOrder', 'query']);

  constructor(
    protected readonly model: Model<TDoc>,
    opts: CrudOptions,
  ) {
    this.entityName = opts.entityName;
    this.filterableFields = opts.filterableFields ?? [];
    this.sortableFields = opts.sortableFields ?? ['createdAt'];
    this.defaultSort = opts.defaultSort ?? { createdAt: -1 };
    this.defaultLimit = opts.defaultLimit ?? 20;
    this.maxLimit = opts.maxLimit ?? 100;
    this.createDateField = opts.createDateField ?? null;
    this.modifyDateField = opts.modifyDateField ?? null;
    this.dateRangeFields = opts.dateRangeFields ?? [];
    this.searchableFields = opts.searchableFields ?? [];
  }

  protected mapCreateDto(dto: TCreateDto): Partial<TDoc> {
    return dto as any;
  }

  protected mapUpdateDto(dto: TUpdateDto): Partial<TDoc> {
    return dto as any;
  }

  protected mapDocToOut(doc: any): TOut {
    return doc as TOut;
  }

  async create(dto: TCreateDto): Promise<TOut> {
    const now = new Date();

    const data: any = {
      ...this.mapCreateDto(dto),
    };

    if (this.createDateField) data[this.createDateField] = now;
    if (this.modifyDateField) data[this.modifyDateField] = now;

    const created = await this.model.create(data);
    const plain = (created as any).toObject ? (created as any).toObject() : created;

    return this.mapDocToOut(plain);
  }

  async findAll(query: CrudFindAllQuery = {}): Promise<PaginatedResult<TOut>> {
    const page = this.normalizePage(query.page);
    const limit = this.normalizeLimit(query.limit);
    const skip = (page - 1) * limit;

    const filter = this.buildFilter(query);
    const sort = this.buildSort(
      typeof query.sortBy === 'string' ? query.sortBy : undefined,
      query.sortOrder,
    );

    const [docs, total] = await Promise.all([
      this.model.find(filter as any).sort(sort).skip(skip).limit(limit).lean(),
      this.model.countDocuments(filter as any),
    ]);

    const pages = Math.max(1, Math.ceil(total / limit));

    return {
      data: (docs as any[]).map(d => this.mapDocToOut(d)),
      meta: {
        page,
        limit,
        total,
        pages,
        sortBy: typeof query.sortBy === 'string' ? query.sortBy : undefined,
        sortOrder: query.sortOrder,
        query: typeof query.query === 'string' ? query.query : undefined,
      },
    };
  }

  async findOne(id: string): Promise<TOut> {
    this.assertObjectId(id);

    const doc = await this.model.findById(id).lean();
    if (!doc) throw new NotFoundException(`${this.entityName} not found`);

    return this.mapDocToOut(doc as any);
  }

  async update(id: string, dto: TUpdateDto): Promise<TOut> {
    this.assertObjectId(id);

    const data: any = {
      ...this.mapUpdateDto(dto),
    };

    if (this.modifyDateField) data[this.modifyDateField] = new Date();

    const doc = await this.model.findByIdAndUpdate(id, data, { new: true }).lean();
    if (!doc) throw new NotFoundException(`${this.entityName} not found`);

    return this.mapDocToOut(doc as any);
  }

  async remove(id: string): Promise<{ ok: true }> {
    this.assertObjectId(id);

    const doc = await this.model.findByIdAndDelete(id).lean();
    if (!doc) throw new NotFoundException(`${this.entityName} not found`);

    return { ok: true };
  }

  protected normalizePage(value: unknown): number {
    const n = typeof value === 'string' ? Number(value) : (value as number);
    if (!Number.isFinite(n) || n < 1) return 1;
    return Math.floor(n);
  }

  protected normalizeLimit(value: unknown): number {
    const n = typeof value === 'string' ? Number(value) : (value as number);
    if (!Number.isFinite(n) || n < 1) return this.defaultLimit;
    return Math.min(this.maxLimit, Math.floor(n));
  }

  protected buildSort(sortBy?: string, sortOrder?: SortOrder): Record<string, SortDir> {
    if (!sortBy) return this.defaultSort;
    if (!this.sortableFields.includes(sortBy)) return this.defaultSort;
    return { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
  }

  protected buildFilter(query: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    const range = this.buildDateRanges(query);

    for (const key of Object.keys(query)) {
      if (this.systemKeys.has(key)) continue;
      if (this.isRangeKey(key)) continue;
      if (!this.filterableFields.includes(key)) continue;
      if (range.has(key)) continue;

      const raw = query[key];
      if (raw === undefined || raw === null) continue;

      const v = Array.isArray(raw) ? raw[0] : raw;

      if (typeof v === 'boolean' || typeof v === 'number') {
        out[key] = v;
        continue;
      }

      if (typeof v !== 'string') {
        out[key] = v;
        continue;
      }

      const trimmed = v.trim();
      if (!trimmed) continue;

      if (trimmed === 'true' || trimmed === 'false') {
        out[key] = trimmed === 'true';
        continue;
      }

      const asNum = Number(trimmed);
      if (Number.isFinite(asNum)) {
        out[key] = asNum;
        continue;
      }

      out[key] = trimmed;
    }

    for (const [field, cond] of range.entries()) {
      out[field] = cond;
    }

    const search = this.buildQuerySearch(query);
    if (search) {
      out.$or = search.$or;
    }

    return out;
  }

  protected buildQuerySearch(query: Record<string, unknown>): { $or: Record<string, unknown>[] } | null {
    const q = typeof query.query === 'string' ? query.query.trim() : '';
    if (!q) return null;
    if (!this.searchableFields.length) return null;

    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    return {
      $or: this.searchableFields.map(field => ({
        [field]: { $regex: safe, $options: 'i' },
      })),
    };
  }

  protected buildDateRanges(query: Record<string, unknown>): Map<string, Record<string, Date>> {
    const out = new Map<string, Record<string, Date>>();

    for (const field of this.dateRangeFields) {
      if (!this.filterableFields.includes(field)) continue;

      const fromKey = `${field}From`;
      const toKey = `${field}To`;

      const fromRaw = query[fromKey];
      const toRaw = query[toKey];

      const fromStr = Array.isArray(fromRaw) ? fromRaw[0] : fromRaw;
      const toStr = Array.isArray(toRaw) ? toRaw[0] : toRaw;

      const cond: Record<string, Date> = {};

      if (typeof fromStr === 'string' && fromStr.trim()) {
        const d = new Date(fromStr.trim());
        if (!Number.isNaN(d.getTime())) cond.$gte = d;
      }

      if (typeof toStr === 'string' && toStr.trim()) {
        const d = new Date(toStr.trim());
        if (!Number.isNaN(d.getTime())) cond.$lte = d;
      }

      if (Object.keys(cond).length) out.set(field, cond);
    }

    return out;
  }

  protected isRangeKey(key: string): boolean {
    return key.endsWith('From') || key.endsWith('To');
  }

  protected assertObjectId(id: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`${this.entityName} not found`);
    }
  }
}

import Builder from "@query/Builder";
import MassAssignmentException from "@exception/MassAssignmentException";
import type { ModelQueryMetadata } from "@model/types";

class Model {
    [x: string]: any;

    private _attributes: Record<string, any> = {};

    protected _original: Record<string, any> = {};

    protected _dirty: Record<string, any> = {};

    protected table: string = ""

    protected primaryKey: string = "id";
    
    protected fillable: string[] = ["*"];
    
    protected guarded: string[] = [];
    
    protected hidden: string[] = [];
    
    protected timestamps: boolean = true;

    protected softDeletes: boolean = false;
    
    protected readonly CREATED_AT: string = "created_at";
    
    protected readonly UPDATED_AT: string = "updated_at";

    protected readonly DELETED_AT: string = "deleted_at";
    
    protected isNew: boolean = true;

    constructor() {
        return new Proxy(this, {
            get(target: Model, prop: string | symbol, receiver: any) {
                if (typeof prop === "string" && !(prop in target)) {
                    return target.getAttribute(prop);
                }

                return Reflect.get(target, prop, receiver);
            },
            set(target: Model, prop: string | symbol, value: any, receiver: any) {
                if (typeof prop !== "string") {
                    return Reflect.set(target, prop, value, receiver);
                }

                if (prop in target) {
                    (target as any)[prop] = value;
                } else if (target.isFillable(prop)) {
                    target.writeAttribute(prop, value);
                }

                return true;
            }
        });
    }

    protected getAttribute(key: string) {
        return this._attributes[key];
    }

    protected cloneValue<T>(value: T): T {
        if (value instanceof Date) {
            return new Date(value.getTime()) as unknown as T;
        }

        if (Array.isArray(value)) {
            return (value.map(item => this.cloneValue(item)) as unknown) as T;
        }

        if (value && typeof value === "object") {
            const cloned: Record<string, any> = {};
            Object.keys(value as Record<string, any>).forEach(key => {
                cloned[key] = this.cloneValue((value as Record<string, any>)[key]);
            });
            return cloned as T;
        }

        return value;
    }

    protected setAttribute(key: string, value: any) {
        this._attributes[key] = this.cloneValue(value);
    }

    protected getOriginal(key?: string) {
        if (!key)
            return this._original;

        return this._original[key];
    }

    protected setOriginal(attributes: Record<string, any>) {
        const cloned: Record<string, any> = {};
        Object.keys(attributes).forEach(key => {
            cloned[key] = this.cloneValue(attributes[key]);
        });

        this._original = cloned;
        this._dirty = {};
    }

    protected syncOriginalAttributes(): void {
        this.setOriginal(this._attributes);
    }

    protected getDirty(key?: string) {
        if (!key)
            return this._dirty;

        return this._dirty[key];
    }

    protected setDirty(key: string, value: any) {
        if (this.getOriginal(key) === value) {
            delete this._dirty[key];
            return;
        }

        this._dirty[key] = value;
    }

    protected writeAttribute(column: string, value: any): void {
        if (!this.isNew) {
            this.setDirty(column, value);
        }

        this.setAttribute(column, value);
    }

    public fill(attributes: Record<string, any>) {
        const totallyGuarded: boolean = this.isTotallyGuarded();

        Object.keys(attributes).forEach((column: string) => {
            if (this.isFillable(column)) {
                this.writeAttribute(column, attributes[column]);
                return;
            }

            if (totallyGuarded) {
                throw new MassAssignmentException(
                    `Add ${column} to fillable property to allow mass assignment on ${this.constructor.name}.`
                );
            }
        });
    }

    protected isFillable(column: string): boolean {
        if (this.fillable.includes(column))
            return true;

        if (this.isGuarded(column))
            return false;

        return this.fillable.length === 0;
    }

    protected isGuarded(column: string): boolean {
        if (this.guarded.length === 0) {
            return false;
        }

        return this.isTotallyGuarded() || this.guarded.includes(column);
    }

    protected isTotallyGuarded(): boolean {
        return this.fillable.length === 0 && this.guarded.length === 1 && this.guarded[0] === "*";
    }

    protected isDirty(): boolean {
        if (this.isNew)
            return false;

        return Object.keys(this._dirty).length > 0;
    }

    static query<T extends Model>(this: { new(): T }, alias?: string): Builder<T> {
        const modelInstance = new this();
        const builder = modelInstance.newQuery();
        if (alias) {
            builder.as(alias);
        }

        return builder;
    }

    public newQuery(): Builder<this> {
        const metadata: ModelQueryMetadata = {
            softDeletes: this.softDeletes,
            deletedAtColumn: this.DELETED_AT
        };

        return new Builder<this>(this, metadata);
    }

    static hydrate<T extends Model>(this: new () => T, records: Record<string, any>[]): T[] {
        return records.map(record => {
            const newInstance = new this();
            newInstance._attributes = { ...record };
            newInstance.setOriginal(newInstance._attributes);
            newInstance.isNew = false;
            return newInstance;
        }) as T[];
    }

    static async create<T extends Model>(this: new () => T, attributes: Record<string, any>): Promise<T> {
        const newInstance: T = new this();
        newInstance.fill(attributes);
        await newInstance.save();
        return newInstance;
    }

    newInstance(attributes: Record<string, any>, isNew = true): this {
        const instance = new (this.constructor as typeof Model)();
        instance.fill(attributes);
        instance.isNew = isNew;
        if (!isNew) {
            instance.syncOriginalAttributes();
        }
        return instance as this;
    }

    async save(): Promise<boolean> {
        const builder = this.newQuery();
        let saved = false;

        if (!this.isNew) {
            saved = await this.performUpdate(builder);
        }
        else {
            saved = await this.performInsert(builder);
        }

        return saved;
    }

    protected async performInsert(builder: Builder<this>): Promise<boolean> {
        this.updateTimestamps();

        const id: number | null = await builder.insertGetId(this._attributes);

        if (id !== null && id !== undefined) {
            this.setAttribute(this.primaryKey, id);
        }

        this.isNew = false;
        this.syncOriginalAttributes();
        return true;
    }

    protected async performUpdate(builder: Builder<this>): Promise<boolean> {
        if (!this.isDirty())
            return true;

        this.updateTimestamps();

        if (this.softDeletes) {
            builder.withTrashed();
        }

        await builder
            .where(this.primaryKey, "=", this.getAttribute(this.primaryKey))
            .update(this.getDirty() as Partial<this>);

        this.syncOriginalAttributes();
        return true;
    }

    protected updateTimestamps() {
        if (this.timestamps) {
            if (!this.getAttribute(this.CREATED_AT) && this.isNew) {
                this.writeAttribute(this.CREATED_AT, this.currentTimestamp());
            }

            this.writeAttribute(this.UPDATED_AT, this.currentTimestamp());
        }
    }

    protected currentTimestamp(): string {
        return new Date().toISOString().replace('T', ' ').substring(0, 19);
    }

    async delete(): Promise<boolean> {
        const key = this.requirePersistedKey("delete");

        if (!this.softDeletes) {
            const deleted = (await this.newQuery()
                .where(this.primaryKey, "=", key)
                .delete()) > 0;

            if (deleted) {
                this.isNew = true;
            }

            return deleted;
        }

        if (this.getAttribute(this.DELETED_AT) != null) {
            return true;
        }

        const timestamp = this.currentTimestamp();
        const attributes: Record<string, any> = {
            [this.DELETED_AT]: timestamp
        };

        if (this.timestamps) {
            attributes[this.UPDATED_AT] = timestamp;
        }

        const affected = await this.newQuery()
            .where(this.primaryKey, "=", key)
            .update(attributes as Partial<this>);

        if (affected === 0) {
            return false;
        }

        Object.entries(attributes).forEach(([column, value]) => {
            this.setAttribute(column, value);
        });
        this.syncOriginalAttributes();
        return true;
    }

    async restore(): Promise<boolean> {
        this.requireSoftDeletes("restore");
        const key = this.requirePersistedKey("restore");

        if (
            Object.prototype.hasOwnProperty.call(this._attributes, this.DELETED_AT) &&
            this.getAttribute(this.DELETED_AT) === null
        ) {
            return true;
        }

        const attributes: Record<string, any> = {
            [this.DELETED_AT]: null
        };

        if (this.timestamps) {
            attributes[this.UPDATED_AT] = this.currentTimestamp();
        }

        const affected = await this.newQuery()
            .onlyTrashed()
            .where(this.primaryKey, "=", key)
            .update(attributes as Partial<this>);

        if (affected === 0) {
            return false;
        }

        Object.entries(attributes).forEach(([column, value]) => {
            this.setAttribute(column, value);
        });
        this.syncOriginalAttributes();
        return true;
    }

    async forceDelete(): Promise<boolean> {
        this.requireSoftDeletes("forceDelete");
        const key = this.requirePersistedKey("force delete");

        const deleted = (await this.newQuery()
            .withTrashed()
            .where(this.primaryKey, "=", key)
            .forceDelete()) > 0;

        if (deleted) {
            this.isNew = true;
        }

        return deleted;
    }

    trashed(): boolean {
        this.requireSoftDeletes("trashed");
        return this.getAttribute(this.DELETED_AT) != null;
    }

    private requireSoftDeletes(method: string): void {
        if (!this.softDeletes) {
            throw new Error(`${method}() is only available on models with soft deletes enabled.`);
        }
    }

    private requirePersistedKey(action: string): string | number {
        const key = this.getAttribute(this.primaryKey);
        if (this.isNew || key === null || key === undefined) {
            throw new Error(`Cannot ${action} an unsaved ${this.constructor.name} model.`);
        }

        return key;
    }

    getTable(): string {
        return this.table;
    }

    getPrimaryKey(): string {
        return this.primaryKey;
    }

    toJSON() {
        const record = { ...this._attributes };
        this.hidden.forEach(hiddenColumn => (delete record[hiddenColumn]));

        return record;
    }

}

export default Model;

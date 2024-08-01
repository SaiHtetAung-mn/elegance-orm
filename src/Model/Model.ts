import Builder from "../Query/Builder";
import { Exclude } from "class-transformer";
import MassAssignmentException from "../Exception/MassAssignmentException";

class Model {
    [x: string]: any;

    @Exclude()
    private _attributes: Record<string, any> = {};

    @Exclude()
    protected table: string = "";

    @Exclude()
    protected primaryKey: string = "id";

    @Exclude()
    protected fillable: string[] = [];

    @Exclude()
    protected guarded: string[] = ["*"];

    @Exclude()
    protected hidden: string[] = [];

    @Exclude()
    protected timestamps: boolean = true;

    @Exclude()
    readonly CREATED_AT: string = "created_at";
    
    @Exclude()
    readonly UPDATED_AT: string = "updated_at";

    @Exclude()
    protected isNew: boolean = true;

    constructor() {
        return new Proxy(this,  {
            get(target: Model, prop: string) {
                if (prop in target) {
                    return target[prop];
                }
                return target.getAttribute(prop);
            },
            set(target: Model, prop: string, value: any) {
                if (prop in target) {
                    target[prop] = value;
                }
                else if(target.isFillable(prop))
                    target.setAttribute(prop, value); 

                return true;
            }
        });
    }

    private setAttribute(key: string, value: any) {
        this._attributes[key] = value;
    }

    private getAttribute(key: string) {
        return this._attributes[key];
    }

    public fill(attributes: Record<string, any>) {
        const totallyGuarded: boolean = this.isTotallyGuarded();

        Object.entries(this.filterFillable(attributes)).forEach(([column, value]) => {
            if (this.isFillable(column)) {
                this.setAttribute(column, value);
            } else if (totallyGuarded) {
                throw new MassAssignmentException(
                    `Add ${column} to fillable property to allow mass assignment on ${this.constructor.name}.`
                );
            }
        });
    }

    private isFillable(column: string): boolean {
        if(this.fillable.includes(column))
            return true;

        if(this.isGuarded(column)) 
            return false;

        return this.fillable.length === 0;
    }

    private filterFillable(attributes: Record<string, any>): Record<string, any> {
        const newAttributes = Object.assign({}, attributes);
        if(this.fillable.length > 0 && !this.isTotallyGuarded()) {
            Object.keys(newAttributes).forEach(key => {
                if(!this.fillable.includes(key))
                    delete newAttributes[key];
            });
        }

        return newAttributes;
    }

    private isGuarded(column: string): boolean {
        if (this.guarded.length === 0) {
            return false;
        }

        return this.isTotallyGuarded() || this.guarded.includes(column);
    }

    private isTotallyGuarded(): boolean {
        return this.fillable.length === 0 && this.guarded.length === 1 && this.guarded[0] === "*";
    }

    static query<T extends Model>(this: { new(): T }): Builder<T> {
        const modelInstance = new this();
        return new Builder<T>(modelInstance);
    }

    static hydrate<T extends Model>(this: new () => T, records: Record<string, any>[]): T[] {
        return records.map(record => {
            const newInstance = new this();
            newInstance.fill(record);
            newInstance.isNew = false;
            return newInstance;
        }) as T[]; 
    }

    static async create<T extends Model>(this: new () => T, attributes: Record<string, any>): Promise<T> {
        const newInstance: T = new this();
        newInstance.fill(attributes);
        const builder = new Builder(newInstance);

        return await builder.create(attributes);
    }

    newInstance(attributes: Record<string, any>, isNew=true): this {
        const instance = new (this.constructor as typeof Model)();
        instance.fill(attributes);
        instance.isNew = isNew;
        return instance as this;
    }

    async save(): Promise<boolean> {
        const builder = new Builder(this);
        let saved = false;

        if(!this.isNew) {
            saved = await this.performUpdate(builder);
        }
        else {
            saved = await this.performInsert(builder);
        }

        return saved;
    }

    private async performInsert(builder: Builder<this>): Promise<boolean> {
        if(this.timestamps)
            this.updateTimestamps();

        const id: number = await builder.insertGetId(this._attributes);
        this.setAttribute(this.primaryKey, id);

        this.isNew = false;
        return true;
    }

    private async performUpdate(builder: Builder<this>): Promise<boolean> {
        return true;
    }

    private updateTimestamps() {
        if(this.timestamps) {
            if(!(this as Record<string, any>)[this.CREATED_AT]) {
                (this as Record<string, any>)[this.CREATED_AT] = this.formatDateToMySQL(new Date)
            }

            (this as Record<string, any>)[this.UPDATED_AT] = this.formatDateToMySQL(new Date);
        }
    }

    private formatDateToMySQL(date: Date) {
        const d = new Date(date);
    
        // Pad single digit numbers with leading zero
        const pad = (num: number, size: number) => num.toString().padStart(size, '0');

        const year = d.getFullYear();
        const month = pad(d.getMonth() + 1, 2);
        const day = pad(d.getDate(), 2);
        const hours = pad(d.getHours(), 2);
        const minutes = pad(d.getMinutes(), 2);
        const seconds = pad(d.getSeconds(), 2);
    
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
    

    getTable(): string {
        return this.table;
    }

    getPrimaryKey(): string {
        return this.primaryKey;
    }

    toJSON() {
        const record = Object.assign({}, this._attributes);
        this.hidden.forEach(hiddenColumn => (delete record[hiddenColumn]));

        return record;
    }
    
}

export default Model;

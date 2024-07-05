import operatorEnum from "../enums/operator"

export type WhereObjType = {
    type: "basic"|"in"|"between"|"null"|"not_null", 
    column: string, 
    operator: operatorEnum|null, 
    value: any, 
    boolean: "and"|"or"
}

export type OrderObjType = {
    column: string, 
    direction: "asc"|"desc"
}

export type QueryObjType = {
    selects: string[],
    distinct: boolean,
    from: string,
    wheres: WhereObjType[],
    groups: string[],
    havings: WhereObjType[],
    orders: OrderObjType[],
    limit: number|null,
    offset: number|null
}
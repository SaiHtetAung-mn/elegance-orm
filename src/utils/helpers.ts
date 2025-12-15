export function methodExists(instance: object, method: string): boolean {
    return typeof (instance as any)[method] === "function";
}

export function firstCharUppercase(str: string): string {
    if (!str || typeof str !== "string") 
        return '';

    return str[0].toUpperCase() + str.slice(1);
}

export function sprintf(format: string, ...args: any) {
    let i = 0;
    return format.replace(/%s/g, () => args[i++]);
}

export function studlyCase(value: string): string {
    return value
        .replace(/[-_]+/g, " ")
        .replace(/(?:^|\s)(\w)/g, (_, char: string) => char.toUpperCase())
        .replace(/\s+/g, "");
}

export function snakeCase(value: string): string {
    return value
        .replace(/\.?([A-Z]+)/g, (_, y: string) => "_" + y.toLowerCase())
        .replace(/[-\s]+/g, "_")
        .replace(/^_+/, "")
        .replace(/_+$/, "")
        .toLowerCase();
}

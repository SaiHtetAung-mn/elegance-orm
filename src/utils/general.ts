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
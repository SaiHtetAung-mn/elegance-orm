class MassAssignmentException extends Error {
    constructor(message: string) {
        super(message);
        this.name = "MassAssignmentException";

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        } else {
            this.toString = function (): string {
                return `${this.name}: ${this.message}`;
            }
        }
    }
}

export default MassAssignmentException;
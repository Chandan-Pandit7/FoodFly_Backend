class ErrorHandler extends Error {
    constructor(statusCode, message = "Code Fat Gaya!!!", errors = [], stack) {
        super(message); // Create the parent 1st which is Error
        this.statusCode = statusCode;
        this.errors = errors;
        this.stack = stack;
        this.message = message;
        this.success = false;
    }
}

export default ErrorHandler;
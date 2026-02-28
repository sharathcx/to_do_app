import { Request, Response, NextFunction } from 'express';
import { ZodError } from "zod";
import Vars from '../globals';

class ApiError extends Error {
    static readonly VALIDATION_ERROR = "VALIDATION_ERROR";
    static readonly BAD_REQUEST = "BAD_REQUEST";
    static readonly UNAUTHORIZED = "UNAUTHORIZED";
    static readonly FORBIDDEN = "FORBIDDEN";
    static readonly NOT_FOUND = "NOT_FOUND";
    static readonly RESOURCE_CONFLICT = "RESOURCE_CONFLICT";
    static readonly UPLOAD_ERROR = "UPLOAD_ERROR";
    static readonly INTERNAL_ERROR = "INTERNAL_ERROR";

    public statusCode: number;
    public data: null;
    public success: boolean;
    public errors: any[];
    public code: string;

    constructor(
        statusCode: number,
        message: string = "Something went wrong",
        code: string = ApiError.INTERNAL_ERROR,
        errors: any[] = [],
        stack?: string
    ) {
        super(message);
        this.statusCode = statusCode;
        this.data = null;
        this.success = false;
        this.errors = errors;
        this.code = code; // Set the error code

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

class ApiResponse<T> {
    public statusCode: number;
    public data: T;
    public message: string;
    public success: boolean;
    public code: string = 'SUCCESS';

    constructor(statusCode: number, data: T, message: string = "Success") {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = statusCode < 400;
    }
}

export function apiResponse<T>(
    data: T,
    message = "Success",
    statusCode = 200,
    success = true,
    code = 'SUCCESS'
): ApiResponse<T> {
    return {
        statusCode, success, message, code, data,
        // timestamp: new Date().toISOString(),
    };
}

const errorHandler = (err: ApiError | ZodError | Error, _req: Request, res: Response, _next: NextFunction) => {
    let statusCode = 500;
    let message = "Internal Server Error";
    let errors: any[] = [];
    let code = ApiError.INTERNAL_ERROR;

    if (err instanceof ApiError) {
        statusCode = err.statusCode;
        message = err.message;
        errors = err.errors;
        code = err.code;
    } else if (err instanceof ZodError) {
        if (Vars.TEST_MODE) console.log(err)
        statusCode = 422;
        message = "Validation failed";
        code = ApiError.VALIDATION_ERROR;

        // map Zod issues to error format
        errors = err.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
            code: issue.code,
        }));
    } else {
        console.error("UNHANDLED ERROR:", err.stack);
    }

    const response = {
        success: false,
        code,
        message,
        ...(errors.length > 0 && { errors }),
    };
    return res.status(statusCode).json(response);
};

export { ApiError, ApiResponse, errorHandler };
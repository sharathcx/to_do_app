import "express";
import 'multer';

declare module "express-serve-static-core" {
    interface Request {
        parsed?: {
            body?: any;
            query?: any;
            params?: any;
        };
    }
}
    
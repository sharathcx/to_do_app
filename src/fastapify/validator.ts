import {NextFunction, Request, Response} from "express";
import {ZodObject} from "zod";

export const validate = (schema: ZodObject<any>) => {
    const middleware = (req: Request, _res: Response, next: NextFunction) => {
        const schemaShape = schema.shape as any;

        const dataForParsing: Record<string, any> = {
            params: req.params,
            query: req.query,
        };

        if (schemaShape.formData) {
            let files: Record<string, any> = {};

            // Handle upload.single()
            if (req.file) {
                files[req.file.fieldname] = req.file;
            }

            // Handle all file upload modes
            if (req.files) {
                if (Array.isArray(req.files)) {
                    // e.g. upload.array()
                    for (const file of req.files) {
                        if (!files[file.fieldname]) files[file.fieldname] = [];
                        files[file.fieldname].push(file);
                    }
                } else if (typeof req.files === "object" && req.files !== null) {
                    // e.g. upload.fields()
                    for (const [field, fileArr] of Object.entries(
                        req.files as Record<string, Express.Multer.File[]>
                    )) {
                        // Flatten single-file fields (image1, image2...) to single object
                        files[field] =
                            Array.isArray(fileArr) && fileArr.length === 1
                                ? fileArr[0]
                                : fileArr;
                    }
                }
            }

            dataForParsing.formData = {...req.body, ...files};
        } else {
            dataForParsing.body = req.body;
        }


        const parsed = schema.parse(dataForParsing);

        (req as any).parsed = {
            body: parsed.body ?? parsed.formData ?? {},
            query: parsed.query ?? {},
            params: parsed.params ?? {},
            files: parsed.formData
                ? Object.fromEntries(
                    Object.entries(parsed.formData).filter(
                        ([_, v]) => typeof v === "object"
                    )
                )
                : {},
        };

        next();

    };

    (middleware as any).schema = schema;
    return middleware;
};
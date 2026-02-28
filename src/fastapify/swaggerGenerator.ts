import { z, ZodObject, ZodType } from 'zod';
// import fs from 'fs';

// --- Interfaces (Unchanged) ---

interface SchemaObject {
    type?: string;
    properties?: { [key: string]: SchemaObject };
    anyOf?: SchemaObject[];

    [key: string]: any; // Allow other properties
}

interface RequestBody {
    content?: {
        'multipart/form-data'?: {
            schema: SchemaObject;
        };
        [key: string]: any; // Allow other content types
    };
}

interface Operation {
    requestBody?: RequestBody;

    [key: string]: any; // Allow other operation properties
}

type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head' | 'trace';

type PathItem = {
    [key in HttpMethod]?: Operation;
} & {
    parameters?: any[]; // Allow other path item properties
};

interface SwaggerSpec {
    paths: {
        [path: string]: PathItem;
    };

    [key: string]: any; // Allow other root properties
}

// --- File Detection Helpers (Un-exported) ---

/**
 * Checks if a schema object is the specific file definition.
 */
function isFileObject(obj: SchemaObject | null | undefined): boolean {
    if (!obj) {
        return false;
    }
    if (obj.type !== 'object') {
        return false;
    }
    if (!obj.properties && !obj.anyOf && !obj.allOf) {
        return false;
    }
    const props = obj.properties;
    if (props) {
        return !!props.fieldname &&
            !!props.originalname &&
            !!props.encoding &&
            !!props.mimetype &&
            !!props.size &&
            props.hasOwnProperty('buffer'); // 'buffer' is key
    }
    return false;
}

/**
 * Checks if a schema is either a file object or an 'anyOf' wrapper.
 */
function isFileSchema(schema: SchemaObject | null | undefined): boolean {
    if (!schema) return false;

    // Case 1: Direct file object
    if (isFileObject(schema)) {
        return true;
    }

    // Case 2: Wrapped in anyOf (for optional files: [FileObject, Null])
    if (schema.anyOf && Array.isArray(schema.anyOf)) {
        return schema.anyOf.some(isFileObject);
    }

    return false;
}

// --- File Rewriter (Exported) ---

/**
 * Iterates over the Swagger spec and replaces file definitions.
 * @param spec - The Swagger spec object (will be modified in-place).
 * @returns {SwaggerSpec} - The modified spec.
 */
export function rewriteSwaggerFileDefinitions(spec: SwaggerSpec): SwaggerSpec {
    if (!spec.paths) {
        return spec;
    }

    for (const path in spec.paths) {
        const pathItem = spec.paths[path];

        for (const method of Object.keys(pathItem) as (keyof PathItem)[]) {
            if (typeof pathItem[method] !== 'object' || pathItem[method] === null || Array.isArray(pathItem[method])) {
                continue;
            }

            const operation: Operation | undefined = pathItem[method];
            const formDataSchema = operation?.requestBody?.content?.['multipart/form-data']?.schema;

            if (formDataSchema && formDataSchema.properties) {
                const properties = formDataSchema.properties;

                for (const fieldName in properties) {
                    const fieldSchema = properties[fieldName];

                    if (isFileSchema(fieldSchema)) {
                        // Replace the complex schema with the simple one
                        properties[fieldName] = {
                            "type": "string",
                            "format": "binary",
                            'required': false,
                        };
                    } else if (fieldSchema.type == 'array') {
                        properties[fieldName] = {
                            "type": "string",
                            "default": []
                        };
                    }
                }
            }
        }
    }
    return spec;
}

// --- Main Program (Exported) ---

export function generateSwaggerSpec(
    routerData: Record<string, {
        path: string;
        methods: string[];
        schemas?: any[];
    }[]>,
    appInfo = {},
    port: number,
    serverUrl: string,
): SwaggerSpec {
    if (serverUrl === 'localhost') {
        serverUrl = `http://localhost:${port}`;
    } else if (!serverUrl.startsWith('http')) {
        serverUrl = `https://${serverUrl}`;
    }

    const swaggerSpec: SwaggerSpec = {
        openapi: '3.0.0',
        info: {
            title: 'Auto-Generated API Documentation',
            version: '1.0.0',
            description: 'API documentation generated from Express routes and Zod schemas',
            ...appInfo,
        },
        servers: [
            {
                url: serverUrl,
                description: 'Development server',
            },
        ],
        paths: {},
        components: {
            schemas: {},
        },
        tags: [],
    };

    // Generate tags
    Object.keys(routerData).forEach(tag => {
        if (tag && tag !== '') {
            swaggerSpec.tags.push({
                name: tag.replace('/', '') || 'default',
                description: `${tag.replace('/', '').charAt(0).toUpperCase() + tag.replace('/', '').slice(1)} related endpoints`,
            });
        }
    });

    // Process each route
    Object.entries(routerData).forEach(([tag, routes]) => {
        routes.forEach(route => {
            const { path, methods, schemas } = route;

            // Inlined toOpenApiPath
            const openApiPath = path.replace(/:([a-zA-Z0-9_]+)/g, '{$1}');

            if (!swaggerSpec.paths[openApiPath]) {
                swaggerSpec.paths[openApiPath] = {};
            }

            methods.forEach(method => {
                const methodLower = method.toLowerCase();
                if (['head', 'options'].includes(methodLower)) return;

                // Inlined generateSummary & generateDescription
                const pathParts = openApiPath.split('/').filter(part => part && !part.startsWith(':') && !part.startsWith('{'));
                const resource = pathParts[pathParts.length - 1] || 'resource';
                const actionMap: { [key: string]: string } = {
                    'GET': 'Get', 'POST': 'Create', 'PUT': 'Update', 'PATCH': 'Modify', 'DELETE': 'Delete'
                };
                const summary = `${actionMap[method] || method} ${resource}`;
                const description = `${summary} endpoint for ${openApiPath}`;

                const operation = {
                    tags: [tag.replace('/', '') || 'default'],
                    summary: summary,
                    description: description,
                    parameters: [] as any[],
                    responses: {
                        '200': { description: 'Successful response' },
                        '400': { description: 'Bad Request' },
                        '500': { description: 'Internal Server Error' },
                    },
                } as any;

                if (schemas && schemas.length > 0) {
                    const schema = schemas[0];
                    try {
                        // Inlined extractPathParameters
                        const pathParamMatches = openApiPath.match(/:(\w+)/g) || openApiPath.match(/\{(\w+)}/g);
                        const pathParams = pathParamMatches
                            ? pathParamMatches.map(match => match.substring(1, match.endsWith('}') ? match.length - 1 : match.length))
                            : [];

                        // Inlined getParameterSchema logic
                        pathParams.forEach(param => {
                            let paramSchema: any = { type: 'string' }; // Default
                            try {
                                const sectionSchema = getSchemaSection(schema, 'params');
                                if (sectionSchema && 'shape' in sectionSchema) {
                                    const pSchema = (sectionSchema as any).shape[param];
                                    if (pSchema) {
                                        // Use combined cleaner function
                                        paramSchema = cleanJsonSchema(tryZodToJsonSchema(pSchema), true);
                                    }
                                }
                            } catch {
                            }

                            operation.parameters.push({
                                name: param,
                                in: 'path',
                                required: true,
                                schema: paramSchema,
                            });
                        });

                        // Query parameters
                        const querySchema = getSchemaSection(schema, 'query');
                        if (querySchema) {
                            const queryJsonSchema = tryZodToJsonSchema(querySchema);
                            if (queryJsonSchema && queryJsonSchema.properties) {
                                Object.entries(queryJsonSchema.properties).forEach(([key, value]) => {
                                    operation.parameters.push({
                                        name: key,
                                        in: 'query',
                                        required: Array.isArray(queryJsonSchema.required) && queryJsonSchema.required.includes(key),
                                        schema: value, // schema is already clean from tryZodToJsonSchema
                                    });
                                });
                            }
                        }

                        // Request body (JSON or FormData)
                        if (['post', 'put', 'patch'].includes(methodLower)) {
                            const bodySchema = getSchemaSection(schema, 'body');
                            const formDataSchema = getSchemaSection(schema, 'formData');

                            if (bodySchema) {
                                operation.requestBody = {
                                    required: true,
                                    content: {
                                        'application/json': {
                                            schema: cleanJsonSchema(tryZodToJsonSchema(bodySchema)),
                                        },
                                    },
                                };
                            } else if (formDataSchema) {
                                operation.requestBody = {
                                    required: false,
                                    content: {
                                        'multipart/form-data': {
                                            schema: cleanJsonSchema(tryZodToJsonSchema(formDataSchema)),
                                        },
                                    },
                                };
                            }
                        }
                    } catch (error) {
                        console.warn(`Error processing schema for ${openApiPath}:`, error);
                    }
                }

                // Inlined dedupeParameters
                const paramMap = new Map<string, any>();
                operation.parameters.forEach((p: any) => {
                    if (!paramMap.has(p.name) || (p.in === 'path' && paramMap.get(p.name).in !== 'path')) {
                        paramMap.set(p.name, p);
                    }
                });
                operation.parameters = Array.from(paramMap.values());

                swaggerSpec.paths[openApiPath][methodLower as HttpMethod] = operation;
            });
        });
    });

    // CRITICAL FIX: Run the rewriter *after* the spec is fully built
    const finalSpec = rewriteSwaggerFileDefinitions(swaggerSpec);

    // Write the *final* spec to a file
    const output = JSON.stringify(finalSpec, null, 2);
    const filePath = 'swaggerSpec.json';

    // fs.writeFile(filePath, output, 'utf8', (err) => {
    //     if (err) {
    //         console.error('Error writing file:', err);
    //     } else {
    //         console.log(`Swagger spec saved to ${filePath}`);
    //     }
    // });

    return finalSpec;
}

// ---------- Remaining Helpers (Un-exported) ----------

function getSchemaSection(schema: ZodObject<any>, section: 'body' | 'params' | 'query' | 'formData'): ZodType | null {
    try {
        const shape = (schema as any).shape;
        return shape ? shape[section] || null : null;
    } catch {
        return null;
    }
}

/**
 * Tries to convert a Zod schema to JSON Schema, using a fallback.
 */
function tryZodToJsonSchema(zodSchema: any): any {
    // If Zod exposes toJSONSchema, prefer it
    if (typeof (z as any).toJSONSchema === 'function') {
        return (z as any).toJSONSchema(zodSchema, { unrepresentable: 'string' });
    }
}

/**
 * Cleans a JSON schema by removing unwanted keys.
 * If isParam is true, it simplifies empty objects to strings.
 */
function cleanJsonSchema(schema: any, isParam: boolean = false): any {
    if (!schema || typeof schema !== 'object') return schema;
    schema.required = []
    const s = { ...schema };
    delete s.$schema;
    delete s.definitions;

    if (isParam && s.type === 'object' && !s.properties) {
        return { type: 'string' };
    }
    return s;
}


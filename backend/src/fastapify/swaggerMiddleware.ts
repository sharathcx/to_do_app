import {Application} from 'express';
import fs from 'fs';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import extractRouterData from './routeDataGenerator';
import {generateSwaggerSpec} from './swaggerGenerator';

export function setupSwaggerUI(
    app: Application,
    options: {
        route?: string;
        appInfo?: {
            title?: string;
            version?: string;
            description?: string;
        },
        port?: number,
        serverUrl?: string
    } = {}
) {
    const {route = '/api-docs', appInfo = {}, port = 3000, serverUrl = 'localhost'} = options;

    // Read your CSS file
    const customCssPath = path.join(__dirname, 'swagger.css');
    const customCss = fs.readFileSync(customCssPath, 'utf8');

    const routerData = extractRouterData(app);
    const swaggerSpec = generateSwaggerSpec(routerData, appInfo, port, serverUrl);

    const swaggerOptions = {
        explorer: true,
        customCss,
        customSiteTitle: 'API Documentation',
        swaggerOptions: {
            docExpansion: 'list',
            filter: true,
            showRequestHeaders: true,
            withCredentials: true,
        },
        withCredentials: true,
    };

    // Serve swagger spec as JSON
    app.get(`${route}/swagger.json`, (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });

    // Serve Swagger UI
    app.use(route, swaggerUi.serve);
    app.get(route, swaggerUi.setup(swaggerSpec, swaggerOptions));

    console.log(`📚 Docs: http://localhost:${port}${route}`);

    return swaggerSpec;
}

import {Application} from "express";


export default function extractRouterData(app: Application) {
    const routerData: Record<string, { path: string; methods: string[]; schemas?: any[] }[]> = {};
    let depth = 0;
    let count = 0;

    function dig(prefix: string, stack: any[]) {
        depth ++;
        for (const layer of stack) {
            count++;
            if (layer.route) {
                const routePath = prefix + (layer.route.path == '/' ? '' : layer.route.path);
                const methods = Object.keys(layer.route.methods).map((m) => m.toUpperCase());
                const schemas: any[] = [];

                layer.route.stack.forEach((routeLayer: any) => {
                    if (routeLayer.handle?.schema) {
                        schemas.push(routeLayer.handle.schema);
                    }
                });
                if (!routerData[`router -- ${depth}`]) {
                    routerData[`router -- ${depth}`] = [];
                }
                routerData[`router -- ${depth}`].push({path: routePath, methods, schemas});
            } else if (layer.name === "router" && layer.handle.stack) {
                console.log(depth)
                const newPath = prefix + (layer.handle.path === undefined ? '' : layer.handle.path);
                dig(newPath, layer.handle.stack);
            }

        }
    }

    if (app.router) {
        dig("", app.router.stack);
    }
    return routerData
}

import {Application, Router} from "express";
import {setupSwaggerUI} from "./swaggerMiddleware";
import {validate} from "./validator";

let defaultAppInfo: object = {
    title: "FastAPIfy API",
    version: "1.0.0",
    description: "Auto-generated API documentation"
}
export default function fastAPIfy(app: Application,
                                  serverUrl = 'localhost',
                                  docRoute = '/docs',
                                  appInfo = defaultAppInfo,
) {

    const originalUse = app.use.bind(app);

    // add path to handlers [Routers] for later access
    app.use = ((path: any, ...handlers: any[]) => {
        if (typeof path === "string") {
            console.log(path)
            handlers.forEach(handler => {
                handler.path = path
            })
            // handlers.forEach(handler => console.log('00000000000000000000000', handler.stack[0].handle))
            return originalUse(path, ...handlers);
        }
        return originalUse(path, ...handlers);
    }) as typeof app.use

    const originalListen = app.listen.bind(app)
    app.listen = ((...args: any[]) => {
        const port = args[0]
        if (!app.router) {
            app.router = app._router;
        }
        setupSwaggerUI(app, {
            route: docRoute, appInfo: appInfo, port: port, serverUrl: serverUrl
        });
        return originalListen(...args)
    }) as typeof app.listen

    return app
}


export function fastAPIfyRouter(router: Router) {

    const originalUse = router.use.bind(router);

    // add path to handlers [Routers] for later access
    router.use = ((path: any, ...handlers: any[]) => {

        if (typeof path === "string") {
            console.log(path)
            handlers.forEach(handler => {
                handler.path = path
            })
            // handlers.forEach(handler => console.log('00000000000000000000000', handler.stack[0].handle))
            return originalUse(path, ...handlers);
        }
        return originalUse(path, ...handlers);
    }) as typeof router.use
    return router
}

export {validate}

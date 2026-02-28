import { Router, Response, Request, NextFunction } from "express";
import { fastAPIfyRouter } from "fastapify";
import userRouter from "modules/user/user.routes";

const apiRouter = fastAPIfyRouter(Router())

function DevMonitor(req: Request, res: Response, next: NextFunction) {
    console.log(`[${Date.now()}] ${req.method} ~ ${req.url}`);
    next();
}

apiRouter.use(DevMonitor);

apiRouter.use('/user', userRouter);

export default apiRouter;


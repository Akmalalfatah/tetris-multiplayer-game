import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(`[Login Service Error]`, err);

    if (err.code === 'P2002') {
        return res.status(409).json({ success: false, message: 'Resource already exists (Duplicate Key)' });
    }

    const status = err.status || 500;
    return res.status(status).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};
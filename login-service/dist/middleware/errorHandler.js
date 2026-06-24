"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, req, res, next) => {
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
exports.errorHandler = errorHandler;

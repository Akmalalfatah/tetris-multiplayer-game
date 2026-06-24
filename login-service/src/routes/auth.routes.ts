import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validateRequest';
import { authenticate } from '../middleware/authenticate';

export const authRouter = Router();
const controller = new AuthController();

authRouter.post(
    '/register',
    [
        body('username').isLength({ min: 3, max: 30 }).trim().escape(),
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
    ],
    validateRequest,
    controller.register
);

authRouter.post(
    '/login',
    [
        body('email').isEmail().normalizeEmail(),
        body('password').notEmpty(),
    ],
    validateRequest,
    controller.login
);

authRouter.post(
    '/refresh',
    [body('refreshToken').notEmpty()],
    validateRequest,
    controller.refresh
);

authRouter.post('/logout', authenticate, controller.logout);
authRouter.get('/verify', authenticate, controller.verify);
authRouter.post('/logout-all', authenticate, controller.logoutAll);
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_controller_1 = require("../controllers/auth.controller");
const validateRequest_1 = require("../middleware/validateRequest");
const authenticate_1 = require("../middleware/authenticate");
exports.authRouter = (0, express_1.Router)();
const controller = new auth_controller_1.AuthController();
exports.authRouter.post('/register', [
    (0, express_validator_1.body)('username').isLength({ min: 3, max: 30 }).trim().escape(),
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
], validateRequest_1.validateRequest, controller.register);
exports.authRouter.post('/login', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').notEmpty(),
], validateRequest_1.validateRequest, controller.login);
exports.authRouter.post('/refresh', [(0, express_validator_1.body)('refreshToken').notEmpty()], validateRequest_1.validateRequest, controller.refresh);
exports.authRouter.post('/logout', authenticate_1.authenticate, controller.logout);
exports.authRouter.get('/verify', authenticate_1.authenticate, controller.verify);
exports.authRouter.post('/logout-all', authenticate_1.authenticate, controller.logoutAll);

/**
 * Specifies the middleware and controller functions to call for each route
 * relating to discount codes.
 */
import express from 'express';
import { addCode } from '../controllers/code.controller.ts';
import { isAuthenticated } from '../controllers/auth.middleware.ts';
import { isAdmin } from '../controllers/admin.middleware.ts';
import 'dotenv/config';

const router = express.Router();

/**
 * A POST route to add a new discount code and update Typeform logic.
 * Checks first if the requestor is authenticated and is an admin.
 * Expects a JSON body with the following fields:
 * - code (string) - The discount code
 * - typeOfDiscount (string) - 'Percent' or 'Dollar'
 * - percentOff (number, optional) - The percent discount if typeOfDiscount is 'Percent'
 * - dollarsOff (number, optional) - The dollar discount if typeOfDiscount is 'Dollar'
 * - discountAmount (number) - The amount to add to discount_price in Typeform
 */
router.post('/add', isAuthenticated, isAdmin, addCode);

export default router;
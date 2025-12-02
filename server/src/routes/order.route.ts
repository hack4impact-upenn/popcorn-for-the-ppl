/**
 * Specifies the middleware and controller functions to call for each route
 * relating to orders.
 */
import express from 'express';
import {
  ingestTypeformOrders,
  getAllOrders,
  deleteAllOrders,
} from '../controllers/order.controller.ts';
import { isAuthenticated } from '../controllers/auth.middleware.ts';

const router = express.Router();

/**
 * A GET route to fetch all orders from the database.
 * Requires authentication.
 */
router.get('/all', isAuthenticated, getAllOrders);

/**
 * A POST route to ingest orders from Typeform API.
 * Expects a formId parameter in the URL.
 * Requires authentication.
 * Fetches responses from Typeform and saves new orders to MongoDB.
 */
router.post('/ingest/:formId', isAuthenticated, ingestTypeformOrders);

/**
 * A DELETE route to delete all orders from the database.
 * Requires authentication.
 */
router.delete('/all', isAuthenticated, deleteAllOrders);

export default router;


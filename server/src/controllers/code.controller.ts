/**
 * All the controller functions containing the logic for routes relating to
 * discount codes such as adding codes and updating Typeform logic.
 */
import express from 'express';
import ApiError from '../util/apiError.ts';
import StatusCode from '../util/statusCode.ts';
import {
  createDiscountCode,
  getDiscountCodeByCode,
} from '../services/code.service.ts';
import 'dotenv/config';

/**
 * Add a new discount code and update Typeform logic.
 * Expects a JSON body with the following fields:
 * - code (string) - The discount code
 * - typeOfDiscount (string) - 'Percent' or 'Dollar'
 * - percentOff (number, optional) - The percent discount if typeOfDiscount is 'Percent'
 * - dollarsOff (number, optional) - The dollar discount if typeOfDiscount is 'Dollar'
 * - discountAmount (number) - The amount to add to discount_price in Typeform
 */
const addCode = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  const { code, typeOfDiscount, percentOff, dollarsOff, discountAmount } =
    req.body;

  // Validate required fields
  if (!code || !typeOfDiscount || discountAmount === undefined) {
    next(
      ApiError.missingFields([
        'code',
        'typeOfDiscount',
        'discountAmount',
      ]),
    );
    return;
  }

  // Validate typeOfDiscount
  if (typeOfDiscount !== 'Percent' && typeOfDiscount !== 'Dollar') {
    next(
      ApiError.badRequest(
        "typeOfDiscount must be either 'Percent' or 'Dollar'",
      ),
    );
    return;
  }

  // Validate that the appropriate discount value is provided
  if (typeOfDiscount === 'Percent' && percentOff === undefined) {
    next(ApiError.missingFields(['percentOff']));
    return;
  }

  if (typeOfDiscount === 'Dollar' && dollarsOff === undefined) {
    next(ApiError.missingFields(['dollarsOff']));
    return;
  }

  try {
    // Check if code already exists
    const existingCode = await getDiscountCodeByCode(code);
    if (existingCode) {
      next(ApiError.badRequest(`Code ${code} already exists`));
      return;
    }

    // Create the discount code in the database
    await createDiscountCode(code, typeOfDiscount, percentOff, dollarsOff);

    // Fetch current form from Typeform
    const formRes = await fetch(
      `https://api.typeform.com/forms/${process.env.FORM_ID}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.TF_API_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!formRes.ok) {
      next(
        ApiError.internal(
          `Failed to fetch Typeform: ${formRes.statusText}`,
        ),
      );
      return;
    }

    const form = await formRes.json();

    // Create the new jump logic
    const newJump = {
      type: 'field',
      from: {
        ref: 'Q3_CUSTOMER_CODE',
      },
      conditions: [
        {
          op: 'equal',
          vars: [
            { type: 'field', ref: 'Q3_CUSTOMER_CODE' },
            { type: 'constant', value: code },
          ],
        },
      ],
      to: {
        type: 'field',
        ref: 'Q5_NEXT_QUESTION',
      },
      actions: [
        {
          action: 'calculator',
          details: {
            operation: 'add',
            value: discountAmount,
            target: 'discount_price',
          },
        },
      ],
    };

    // Add this to form.logic.jumps
    const updatedLogic = {
      logic: {
        jumps: [...(form.logic?.jumps || []), newJump],
      },
    };

    // Push update back to Typeform
    const updateRes = await fetch(
      `https://api.typeform.com/forms/${process.env.FORM_ID}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${process.env.TF_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedLogic),
      },
    );

    if (!updateRes.ok) {
      next(
        ApiError.internal(
          `Failed to update Typeform: ${updateRes.statusText}`,
        ),
      );
      return;
    }

    const updateData = await updateRes.json();
    res.status(StatusCode.CREATED).json(updateData);
  } catch (err: any) {
    console.error(err);
    next(ApiError.internal(`Failed to add code: ${err.message}`));
  }
};

export { addCode };


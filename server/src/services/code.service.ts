/**
 * All the functions for interacting with discount code data in the MongoDB database
 */
import { IDiscountCode, DiscountCode } from '../models/codes.model.ts';

/**
 * Creates a new discount code in the database.
 * @param code - string representing the discount code
 * @param typeOfDiscount - 'Percent' or 'Dollar'
 * @param percentOff - optional number for percent discount
 * @param dollarsOff - optional number for dollar discount
 * @returns The created {@link DiscountCode}
 */
const createDiscountCode = async (
  code: string,
  typeOfDiscount: 'Percent' | 'Dollar',
  percentOff?: number,
  dollarsOff?: number,
) => {
  const newDiscountCode = new DiscountCode({
    code,
    typeOfDiscount,
    percentOff,
    dollarsOff,
  });
  const discountCode = await newDiscountCode.save();
  return discountCode;
};

/**
 * Gets a discount code from the database by the code string.
 * @param code The code string to search for
 * @returns The {@link DiscountCode} or null if not found.
 */
const getDiscountCodeByCode = async (
  code: string,
): Promise<IDiscountCode | null> => {
  return DiscountCode.findOne({ code }).exec();
};

/**
 * Gets all discount codes from the database.
 * @returns An array of all {@link DiscountCode} objects
 */
const getAllDiscountCodes = async (): Promise<IDiscountCode[]> => {
  return DiscountCode.find({}).exec();
};

export {
  createDiscountCode,
  getDiscountCodeByCode,
  getAllDiscountCodes,
};


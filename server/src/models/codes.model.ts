import mongoose from 'mongoose';

const DiscountCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    typeOfDiscount: {
      type: String,
      enum: ['Percent', 'Dollar'],
      required: true,
    },
    percentOff: {
      type: Number, // float
    },
    dollarsOff: {
      type: Number, // float
    },
  },
  {
    timestamps: true,
  }
);

interface IDiscountCode extends mongoose.Document {
  _id: string;
  code: string;
  timestamp: Date;
  typeOfDiscount: 'Percent' | 'Dollar';
  percentOff?: number;
  dollarsOff?: number;
  createdAt: Date;
  updatedAt: Date;
}

const DiscountCode = mongoose.model<IDiscountCode>(
  'DiscountCode',
  DiscountCodeSchema,
  'discountcodes'
);

export { IDiscountCode, DiscountCode };

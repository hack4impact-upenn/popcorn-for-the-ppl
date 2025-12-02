/**
 * Defines the Order model for the database and also the interface to
 * access the model in TypeScript.
 */
import mongoose from 'mongoose';

const PopcornQuantitiesSchema = new mongoose.Schema({
  caramel: { type: Number, default: 0 },
  respresso: { type: Number, default: 0 },
  butter: { type: Number, default: 0 },
  cheddar: { type: Number, default: 0 },
  kettle: { type: Number, default: 0 },
});

const OrderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  uuid: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    default: '',
  },
  company: {
    type: String,
    default: '',
  },
  discountCode: {
    type: String,
    default: '',
  },
  discountPrice: {
    type: Number,
    default: 0,
  },
  amountPaid: {
    type: Number,
    required: true,
    default: 0,
  },
  status: {
    type: String,
    enum: [
      'Inquiry',
      'Confirmed',
      'In Production',
      'Ready to Ship',
      'Shipped',
      'Invoiced',
    ],
    required: true,
    default: 'Inquiry',
  },
  popcornQuantities: {
    type: PopcornQuantitiesSchema,
    required: true,
    default: () => ({
      caramel: 0,
      respresso: 0,
      butter: 0,
      cheddar: 0,
      kettle: 0,
    }),
  },
  submittedAt: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
OrderSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

interface IPopcornQuantities {
  caramel: number;
  respresso: number;
  butter: number;
  cheddar: number;
  kettle: number;
}

interface IOrder extends mongoose.Document {
  _id: string;
  orderId: string;
  uuid: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  phoneNumber: string;
  company: string;
  discountCode: string;
  discountPrice: number;
  amountPaid: number;
  status:
    | 'Inquiry'
    | 'Confirmed'
    | 'In Production'
    | 'Ready to Ship'
    | 'Shipped'
    | 'Invoiced';
  popcornQuantities: IPopcornQuantities;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const Order = mongoose.model<IOrder>('Order', OrderSchema);

export { IOrder, Order, IPopcornQuantities };


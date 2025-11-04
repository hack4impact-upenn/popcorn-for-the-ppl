import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema(
  {
    flavorOrDescription: {
      // "FLAVOR / BAG DESCRIPTION"
      type: String,
      required: true,
    },
    upc: {
      // "UPC"
      type: String,
    },
    cases: {
      // "CASES" (user fills this in)
      type: Number,
    },
    quantityPerCase: {
      // "QUANTITY/ CASE"
      type: Number,
    },
    totalQuantity: {
      // "TOTAL QUANTITY" (can be computed: cases * quantityPerCase)
      type: Number,
    },
    unitCost: {
      // "UNIT COST"
      type: Number,
    },
    amount: {
      // "AMOUNT" (can be computed: totalQuantity * unitCost)
      type: Number,
    },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    // basic order info
    orderNumber: {
      type: String,
    },
    status: {
      type: String,
      enum: ['Draft', 'Submitted', 'Confirmed', 'Shipped', 'Cancelled'],
      default: 'Draft',
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },

    // BILL TO block
    billTo: {
      attn: { type: String },
      companyName: { type: String },
      streetAddress: { type: String },
      cityStateZip: { type: String },
      phone: { type: String },
      email: { type: String },
    },

    // SHIP TO block
    shipTo: {
      attn: { type: String },
      companyName: { type: String },
      streetAddress: { type: String },
      cityStateZip: { type: String },
      phone: { type: String },
      email: { type: String },
    },

    // line items from the table
    items: [OrderItemSchema],

    // money / totals
    subtotal: {
      type: Number,
    },
    shippingAmount: {
      // form says "Shipping will be added..."
      type: Number,
    },
    taxAmount: {
      type: Number,
    },
    totalAmount: {
      type: Number,
    },

    // misc
    notes: {
      type: String,
    },
    signedBy: {
      // "Signature" line at bottom
      type: String,
    },
    signedDate: {
      // "Date" line at bottom
      type: Date,
    },

    // optional: link to org/customer if you're tying it to another collection
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },
  },
  {
    timestamps: true,
  }
);

interface IOrder extends mongoose.Document {
  _id: string;
  orderNumber?: string;
  status: 'Draft' | 'Submitted' | 'Confirmed' | 'Shipped' | 'Cancelled';
  orderDate: Date;

  billTo?: {
    attn?: string;
    companyName?: string;
    streetAddress?: string;
    cityStateZip?: string;
    phone?: string;
    email?: string;
  };

  shipTo?: {
    attn?: string;
    companyName?: string;
    streetAddress?: string;
    cityStateZip?: string;
    phone?: string;
    email?: string;
  };

  items: {
    flavorOrDescription: string;
    upc?: string;
    cases?: number;
    quantityPerCase?: number;
    totalQuantity?: number;
    unitCost?: number;
    amount?: number;
  }[];

  subtotal?: number;
  shippingAmount?: number;
  taxAmount?: number;
  totalAmount?: number;

  notes?: string;
  signedBy?: string;
  signedDate?: Date;

  customerId?: string;
}

const Order = mongoose.model<IOrder>('Order', OrderSchema, 'orders');

export { IOrder, Order };

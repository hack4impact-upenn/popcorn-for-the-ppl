/**
 * Controller functions for handling order-related operations,
 * including ingesting data from Typeform.
 */
import express from 'express';
import axios from 'axios';
import mongoose from 'mongoose';
import { Order, IOrder } from '../models/order.model.ts';
import ApiError from '../util/apiError.ts';
import StatusCode from '../util/statusCode.ts';

/**
 * Typeform API response types
 */
interface TypeformAnswer {
  field: {
    id: string;
    type: string;
    ref: string;
  };
  type: string;
  text?: string;
  number?: number;
  email?: string;
  phone_number?: string;
  choice?: {
    label: string;
  };
  choices?: {
    labels: string[];
  };
}

interface TypeformVariable {
  key: string;
  type?: string;
  number?: number;
  value?: string | number;
}

interface TypeformResponse {
  landing_id: string;
  token: string;
  response_id: string;
  response_type: string;
  landed_at: string;
  submitted_at: string;
  answers: TypeformAnswer[];
  variables: TypeformVariable[];
}

interface TypeformApiResponse {
  items: TypeformResponse[];
  total_items: number;
  page_count: number;
}

/**
 * Helper function to extract value from Typeform answer
 */
function getAnswerValue(answer: TypeformAnswer): string | number | null {
  if (answer.text) return answer.text;
  if (answer.number !== undefined) return answer.number;
  if (answer.email) return answer.email;
  if (answer.phone_number) return answer.phone_number;
  if (answer.choice) return answer.choice.label;
  if (answer.choices && answer.choices.labels.length > 0) {
    return answer.choices.labels[0];
  }
  return null;
}

/**
 * Helper function to find answer by field reference
 */
function findAnswerByRef(
  answers: TypeformAnswer[],
  ref: string,
): TypeformAnswer | undefined {
  return answers.find((answer) => answer.field.ref === ref);
}

/**
 * Helper function to find variable by key
 */
function findVariableByKey(
  variables: TypeformVariable[],
  key: string,
): TypeformVariable | undefined {
  return variables.find((variable) => variable.key === key);
}

/**
 * Map Typeform response to Order format
 * Matches the extraction logic from test.js
 */
function mapTypeformResponseToOrder(
  response: TypeformResponse,
): Partial<IOrder> | null {
  try {
    const { answers, response_id, submitted_at, variables } = response;

    if (!answers || answers.length < 4) {
      console.warn(
        `Not enough answers for response ${response_id}. Found ${answers?.length || 0} answers`,
      );
      return null;
    }

    // Extract basic fields by index (matching test.js logic)
    // Note: answers[0] and answers[1] should be text fields (first/last name)
    // answers[2] should be phone_number, answers[3] should be email
    const firstName = answers[0]?.text || '';
    const lastName = answers[1]?.text || '';
    const phoneNumber = answers[2]?.phone_number || '';
    
    // Email might be at index 3, but let's also check for email type
    let email = answers[3]?.email || '';
    if (!email) {
      // Try to find email in any answer
      const emailAnswer = answers.find((a) => a.type === 'email');
      email = emailAnswer?.email || '';
    }

    if (!email) {
      console.error(
        `❌ No email found for response ${response_id}`,
      );
      console.error(`   Answers structure:`, answers.map((a, idx) => ({
        index: idx,
        type: a.type,
        fieldType: a.field?.type,
        fieldId: a.field?.id,
        hasText: !!a.text,
        hasEmail: !!a.email,
        hasPhone: !!a.phone_number,
      })));
      return null;
    }

    const name = `${firstName} ${lastName}`.trim() || email;

    // Extract company - find by field ID 'Oh5JQY5PZFww'
    let company = '';
    const companyIndex = answers.findIndex(
      (item) => item.field?.id === 'Oh5JQY5PZFww',
    );
    if (companyIndex !== -1) {
      company = answers[companyIndex]?.text || '';
    }

    // Extract discount code - find by field ID 'cWlsB4bhhrqY'
    let discountCode = '';
    const discountCodeIndex = answers.findIndex(
      (item) => item.field?.id === 'cWlsB4bhhrqY',
    );
    if (discountCodeIndex !== -1) {
      discountCode = answers[discountCodeIndex]?.text || '';
    }

    // Extract popcorn quantities - start from field ID 'ShAWyFsXRXQB'
    const popcornStartIndex = answers.findIndex(
      (item) => item.field?.id === 'ShAWyFsXRXQB',
    );

    const popcornQuantities = {
      caramel: 0,
      respresso: 0,
      butter: 0,
      cheddar: 0,
      kettle: 0,
    };

    if (popcornStartIndex !== -1) {
      // Get the next 5 number fields starting from popcornStartIndex
      popcornQuantities.caramel = answers[popcornStartIndex]?.number || 0;
      popcornQuantities.respresso = answers[popcornStartIndex + 1]?.number || 0;
      popcornQuantities.butter = answers[popcornStartIndex + 2]?.number || 0;
      popcornQuantities.cheddar = answers[popcornStartIndex + 3]?.number || 0;
      popcornQuantities.kettle = answers[popcornStartIndex + 4]?.number || 0;
    }

    // Extract amountPaid and discountPrice from variables (matching test.js logic)
    // variables[0] = discountPrice, variables[1] = amountPaid
    console.log(variables)
    console.log("AAAAA")
    const amountPaid = variables[1]?.number ?? 0;
    const discountPrice = variables[0]?.number ?? 0;

          return {
            orderId: response_id, // Use uuid as orderId
            uuid: response_id,
            email,
            firstName,
            lastName,
            name,
            phoneNumber,
            company,
            discountCode,
            amountPaid,
            discountPrice,
            status: 'Inquiry' as const,
            popcornQuantities,
            submittedAt: new Date(submitted_at),
          };
  } catch (error) {
    console.error('Error mapping Typeform response:', error);
    return null;
  }
}

/**
 * Controller function to ingest orders from Typeform API
 * Fetches responses from Typeform and saves new orders to MongoDB
 */
const ingestTypeformOrders = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  try {
    const { formId } = req.params;
    const typeformApiKey = process.env.TYPEFORM_API_KEY;

    if (!typeformApiKey) {
      next(
        ApiError.internal(
          'TYPEFORM_API_KEY environment variable is not set',
        ),
      );
      return;
    }

    if (!formId) {
      next(ApiError.badRequest('Form ID is required'));
      return;
    }

    // Fetch responses from Typeform API
    const typeformUrl = `https://api.typeform.com/forms/${formId}/responses`;
    const response = await axios.get<TypeformApiResponse>(typeformUrl, {
      headers: {
        Authorization: `Bearer ${typeformApiKey}`,
      },
    });

    const { items } = response.data;
    const newOrders: IOrder[] = [];
    const skippedOrders: string[] = [];

    // Process each response
    console.log(`\n=== INGESTING ORDERS ===`);
    console.log(`Processing ${items.length} responses from Typeform`);
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      console.log(`\n[${i + 1}/${items.length}] Processing response: ${item.response_id}`);
      console.log(`  Submitted at: ${item.submitted_at}`);
      console.log(`  Answers count: ${item.answers?.length || 0}`);
      
      // Check if order already exists
      console.log(item)
      const existingOrder = await Order.findOne({ uuid: item.response_id });
      if (existingOrder) {
        console.log(`  ⚠️  Order ${item.response_id} already exists in DB`);
        console.log(`     Existing order: ${existingOrder.email} - ${existingOrder.name}`);
        console.log(`     Existing order _id: ${existingOrder._id}`);
        skippedOrders.push(item.response_id);
        continue;
      }
      console.log(`  ✅ Order ${item.response_id} is NEW (not in DB), will process`);

      // Map Typeform response to Order format
      console.log(`  Mapping order...`);
      const orderData = mapTypeformResponseToOrder(item);
      if (!orderData) {
        console.error(`  ❌ FAILED TO MAP order ${item.response_id} - will skip`);
        console.error(`  Response data:`, {
          response_id: item.response_id,
          answers_count: item.answers?.length || 0,
          answers_types: item.answers?.map((a: any) => a.type) || [],
          first_answer: item.answers?.[0] || 'none',
        });
        skippedOrders.push(item.response_id);
        continue;
      }
      console.log(`  ✅ Successfully mapped: ${orderData.email} (${orderData.name})`);
      console.log(`     Mapped data: uuid=${orderData.uuid}, firstName=${orderData.firstName}, lastName=${orderData.lastName}`);

      // Create and save order
      try {
        console.log(`  Creating order document for: ${orderData.email}`);
        console.log(`     Order data keys:`, Object.keys(orderData));
        const order = new Order(orderData);
        console.log(order);
        const savedOrder = await order.save();
        console.log(`  💾✅ SUCCESSFULLY SAVED: ${savedOrder.uuid} - ${savedOrder.email}`);
        console.log(`     MongoDB _id: ${savedOrder._id}`);
        console.log(`     Verified in DB:`, await Order.findOne({ uuid: savedOrder.uuid }) ? 'YES' : 'NO');
        newOrders.push(savedOrder);
      } catch (saveError: any) {
        console.error(`  ❌❌ ERROR SAVING order ${item.response_id}:`);
        console.error(`     Message: ${saveError.message}`);
        console.error(`     Code: ${saveError.code}`);
        console.error(`     Name: ${saveError.name}`);
        if (saveError.code === 11000) {
          console.error(`     ⚠️  DUPLICATE KEY ERROR - order with this UUID may already exist`);
          // Check if it actually exists
          const checkOrder = await Order.findOne({ uuid: item.response_id });
          console.error(`     Order exists check:`, checkOrder ? `YES (${checkOrder.email})` : 'NO');
        }
        if (saveError.errors) {
          console.error(`     Validation errors:`, JSON.stringify(saveError.errors, null, 2));
        }
        if (saveError.keyPattern) {
          console.error(`     Duplicate key pattern:`, saveError.keyPattern);
        }
        skippedOrders.push(item.response_id);
      }
    }
    console.log(`\n=== INGESTION COMPLETE ===`);

    // Verify all orders are in database
    const totalInDB = await Order.countDocuments({});
    console.log(`\n📊 Summary: ${newOrders.length} new orders, ${skippedOrders.length} skipped`);
    console.log(`📦 Total orders in database: ${totalInDB}`);
    console.log(`📥 Total responses from Typeform: ${items.length}`);
    
    if (newOrders.length > 0) {
      console.log(`✅ New order UUIDs:`, newOrders.map((o) => o.uuid));
    }
    if (skippedOrders.length > 0) {
      console.log(`⏭️  Skipped UUIDs:`, skippedOrders);
      // Check why each was skipped
      console.log(`\n🔍 Checking why orders were skipped:`);
      for (const skippedUuid of skippedOrders) {
        const exists = await Order.findOne({ uuid: skippedUuid });
        if (exists) {
          console.log(`   ${skippedUuid}: EXISTS in DB (${exists.email}) - correctly skipped`);
        } else {
          console.log(`   ${skippedUuid}: NOT in DB - was skipped due to mapping/save failure!`);
        }
      }
    }
    
    // List all orders in DB
    const allOrdersInDB = await Order.find({}).select('uuid email name').exec();
    console.log(`\n📋 All orders currently in database (${allOrdersInDB.length}):`);
    if (allOrdersInDB.length === 0) {
      console.log(`   ⚠️  NO ORDERS IN DATABASE!`);
    } else {
      allOrdersInDB.forEach((o, idx) => {
        console.log(`   ${idx + 1}. ${o.uuid}: ${o.email} - ${o.name}`);
      });
    }

    res.status(StatusCode.OK).json({
      message: 'Orders ingested successfully',
      newOrdersCount: newOrders.length,
      skippedCount: skippedOrders.length,
      totalInDatabase: totalInDB,
      newOrders: newOrders.map((o) => ({
        uuid: o.uuid,
        email: o.email,
        name: o.name,
      })),
      skippedUuids: skippedOrders,
    });
  } catch (error: any) {
    if (error.response) {
      // Typeform API error
      next(
        ApiError.internal(
          `Typeform API error: ${error.response.status} - ${error.response.statusText}`,
        ),
      );
    } else if (error.request) {
      // Request made but no response
      next(ApiError.internal('No response from Typeform API'));
    } else {
      // Other error
      next(ApiError.internal(`Error ingesting orders: ${error.message}`));
    }
  }
};

/**
 * Controller function to get all orders from the database
 */
const getAllOrders = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  try {
    // Verify MongoDB connection
    const connectionState = mongoose.connection.readyState;
    console.log(`MongoDB connection state: ${connectionState} (0=disconnected, 1=connected, 2=connecting, 3=disconnecting)`);
    
    const orders = await Order.find({}).sort({ submittedAt: -1 }).exec();
    console.log(`\n=== FETCHING ORDERS ===`);
    console.log(`Found ${orders.length} orders in database`);
    
    // Log order UUIDs and emails for debugging
    if (orders.length > 0) {
      console.log('Order UUIDs in database:', orders.map((o) => o.uuid));
      console.log('Order emails in database:', orders.map((o) => o.email));
      console.log('Order names in database:', orders.map((o) => o.name));
      orders.forEach((order, idx) => {
        console.log(`  [${idx + 1}] ${order.uuid}: ${order.email} - ${order.name}`);
      });
    } else {
      console.warn('⚠️  No orders found in database!');
    }

    // Transform to match frontend IOrder interface
    const ordersData = orders.map((order) => {
      const popcornQuantities = order.popcornQuantities || {
        caramel: 0,
        respresso: 0,
        butter: 0,
        cheddar: 0,
        kettle: 0,
      };

      return {
        orderId: order.uuid || '', // Use uuid as orderId
        uuid: order.uuid || '',
        email: order.email || '',
        name: order.name || '',
        amountPaid: order.amountPaid || 0,
        status: order.status || 'Inquiry',
        popcornQuantities,
        submittedAt: order.submittedAt
          ? order.submittedAt.toISOString()
          : new Date().toISOString(),
        createdAt: order.createdAt
          ? order.createdAt.toISOString()
          : new Date().toISOString(),
        updatedAt: order.updatedAt
          ? order.updatedAt.toISOString()
          : new Date().toISOString(),
      };
    });

    console.log(`Returning ${ordersData.length} orders to frontend`);
    console.log(`Orders data:`, JSON.stringify(ordersData.map(o => ({ uuid: o.uuid, email: o.email })), null, 2));
    
    // Explicitly ensure it's an array
    if (!Array.isArray(ordersData)) {
      console.error('ERROR: ordersData is not an array!', typeof ordersData);
      return res.status(StatusCode.OK).json([]);
    }
    
    res.status(StatusCode.OK).json(ordersData);
  } catch (error: any) {
    console.error('Error in getAllOrders:', error);
    console.error('Error stack:', error.stack);
    next(ApiError.internal(`Error fetching orders: ${error.message}`));
  }
};

/**
 * Controller function to delete all orders from the database
 */
const deleteAllOrders = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  try {
    const result = await Order.deleteMany({});
    console.log(`\n=== DELETING ALL ORDERS ===`);
    console.log(`Deleted ${result.deletedCount} orders from database`);
    
    res.status(StatusCode.OK).json({
      message: 'All orders deleted successfully',
      deletedCount: result.deletedCount,
    });
  } catch (error: any) {
    console.error('Error deleting orders:', error);
    next(ApiError.internal(`Error deleting orders: ${error.message}`));
  }
};

export { ingestTypeformOrders, getAllOrders, deleteAllOrders };


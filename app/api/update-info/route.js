"use server"

import { getDatabaseConnection } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { id, email, address, details, connectform, loginformId, cart, interest, order } = await req.json();

  if (!email) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 });
  }

  const db = await getDatabaseConnection();

  try {
    // Get user_id from users table based on the provided username (id)
    const [userRows] = await db.query('SELECT user_id FROM users WHERE email = ?', [email]);

    if (userRows.length === 0) {
      db.release();
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = userRows[0].user_id;

    // Update data with retry logic
    const success = await updateUserDataWithRetry(db, id, userId, address, details, connectform, loginformId, cart, interest, order, 3); // 최대 3번 재시도
    if (!success) {
      return NextResponse.json({ error: 'Failed to update data after multiple attempts' }, { status: 500 });
    }

    db.release();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

async function updateUserDataWithRetry(db, id, userId, address, details, connectform, loginformId, carts, interests, orders, maxRetries) {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      await db.query('START TRANSACTION');

      // Delete existing records
      await db.query('DELETE FROM cart WHERE user_id = ?', [userId]);
      await db.query('DELETE FROM interest WHERE user_id = ?', [userId]);
      await db.query('DELETE FROM orders WHERE user_id = ?', [userId]);
      
      if( loginformId ) {
        await db.query('UPDATE USERS SET connectform = ?, loginform_id = ? WHERE user_id = ?', [connectform,loginformId,userId])
      } else {
        await db.query('UPDATE USERS SET username = ?, address = ?, address_detail = ? WHERE user_id = ?', [id,address,details,userId])
        // Insert new carts
        if (carts && Array.isArray(carts) && carts.length !== 0) {
          for (const cart of carts) {
            await db.query(
              'INSERT INTO cart (user_id, cart_name, cart_category, cart_price, cart_quantity, cart_img, cart_isChked) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [userId, cart.cart_name, cart.cart_category, cart.cart_price, cart.cart_quantity, cart.cart_img, cart.cart_isChked]
            );
          }
        }
  
        // Insert new interests
        if (interests && Array.isArray(interests) && interests.length !== 0) {
          for (const interest of interests) {
            await db.query(
              'INSERT INTO interest (user_id, intrst_name, intrst_category, intrst_price, intrst_img) VALUES (?, ?, ?, ?, ?)',
              [userId, interest.intrst_name, interest.intrst_category, interest.intrst_price, interest.intrst_img]
            );
          }
        }

        if (orders && Array.isArray(orders) && orders.length !== 0) {
          for (const order of orders) {
            await db.query(
              'INSERT INTO orders (user_id, order_name, order_category, order_price, order_quantity, order_img) VALUES (?, ?, ?, ?, ?, ?)',
              [userId, order.order_name, order.order_category, order.order_price, order.order_quantity, order.order_img]
            );
          }
        }
      }


      await db.query('COMMIT');
      return true;
    } catch (error) {
      if (error.errno === 1205) { // Lock wait timeout
        attempt++;
        console.warn(`Attempt ${attempt} failed, retrying...`);
        await db.query('ROLLBACK');
        continue;
      }
      await db.query('ROLLBACK');
      throw error;
    }
  }
  return false;
}

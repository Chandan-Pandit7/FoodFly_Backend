import express from 'express';
import {
	getAddCart,
	getCartItemDelete,
	getCartItemIncrease,
	getCartItemDecrease,
	getCartItems,
} from "../controller/cart.js";

const router = express.Router();

router.get("/view-cart-items", getCartItems)
router.get("/add-cart/:id", getAddCart);
router.get("/cart-item-increase/:id", getCartItemIncrease);
router.get("/cart-item-decrease/:id", getCartItemDecrease);
router.get("/cart-item-delete/:id", getCartItemDelete);


export default router;
// HOMEWORK
// - CRUD CART
// CRUD DETAILS
// RAZORPAY API DUMMY INTEGRATION
// CR - ORDER HISTORY
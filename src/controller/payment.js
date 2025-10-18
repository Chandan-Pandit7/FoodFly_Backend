import ErrorHandler from "../utils/ErrorHandler.js";
import ErrorWrapper from "../utils/ErrorWrapper.js";
import User from "../models/user.js";
import crypto from "crypto";
import Razorpay from "razorpay";


export const postCreateOrder = ErrorWrapper(async (req, res, next) => {

    const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    const options = req.body;
    // console.log(options);
    try {
        const order = await razorpay.orders.create(options);
        // console.log(order);
        if (!order) throw new ErrorHandler(500, "Error while creating order!")
        
        res.status(200).json(order);        
    } catch (error) {
        // console.log(error);
        throw new ErrorHandler(550, "Error while order!");
    }
})


export const postVerifyOrder = ErrorWrapper(async (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  // console.log(razorpay_order_id, razorpay_payment_id, razorpay_signature);

  try {
    const sha = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    sha.update(razorpay_order_id + "|" + razorpay_payment_id);
    const expectedSignature = sha.digest("hex");

    if (expectedSignature !== razorpay_signature) {
      throw new ErrorHandler(400, "Invalid Transaction!");
    }

    const user = await User.findById(req.user._id);
    if (!user) throw new ErrorHandler(404, "User not found!");
    // console.log(user.cart);

    

    // ✅ Construct new order entry
    const newOrder = {
      date: new Date(),
      items: user.cart?.map((cartItem) => ({
        name: cartItem.food?.name,
        price: cartItem.food?.price,
        quantity: cartItem.quantity,
        id: cartItem.food?._id,
        image:cartItem.food.images.map(img=>img.url)
      })) || [],
      totalPrice: user.cart?.reduce(
        (acc, item) => acc + item.food?.price * item.quantity,
        0
      ),
      paymentDetails: {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
      },
      address: user.address || {}, // optional
    };

    // ✅ Push the new order to history
    user.orderHistory.unshift(newOrder);

    // ✅ Clear cart after successful order
    user.cart = [];

    await user.save();

    res.status(200).json({
      success: true,
      message: "Transaction Successful & Order Saved!",
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
    });
  } catch (error) {
    // console.error(error);
    throw new ErrorHandler(error.statusCode || 500, error.message);
  }
});

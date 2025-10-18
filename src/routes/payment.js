import express from "express"
const router = express.Router();

import{
    postCreateOrder,
    postVerifyOrder

}
from "../controller/payment.js"

router.post("/create-order", postCreateOrder);
router.post("/verify-order", postVerifyOrder);

export default  router;
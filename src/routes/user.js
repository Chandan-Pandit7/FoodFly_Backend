import express from "express"
const router = express.Router();

import{
    getProfile,
    postUpdateDetails,
    postAddAddress,
    postUpdateAddress,
    getDeleteAddress,
    getPlaceOrder,
    getOrderHistory,
    getUser,
    getAddFavourite,
    getDeleteFavourite,
    getLogout

}from "../controller/user.js"

router.get("/get-profile", getProfile);
router.post("/update-details",postUpdateDetails);
router.post('/add-address', postAddAddress);
router.post('/update-address/:id', postUpdateAddress);
router.get('/delete-address/:id', getDeleteAddress);
router.get('/place-order/', getPlaceOrder);
router.get('/order-history', getOrderHistory);
router.get('/get-user', getUser)
router.get("/add-favourite/:id", getAddFavourite);
router.get("/delete-favourite/:id", getDeleteFavourite);
router.get('/logout', getLogout);


export default  router;
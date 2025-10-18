import express from "express";

import {
    postRestaurant,
	postCusineCategoryAdd,
	postAddFoodItem,
	postUpdateFoodItem,
	getDeleteFoodItem,
	getFoodItem,
	getFoodItems,
	getAllCusines,
	postAddFoodImages,
	postAddReview,
	postUpdateReview,
	getDeleteReview,
	getAllReviews,
	getReview,
	getAllRestaurants,
	getRestaurant,
	// getFavourites,
} from "../controller/restaurant.js";

const router = express.Router();

// restaurant CRUD:
router.post("/register", postRestaurant);
router.post("/add-cusine-category", postCusineCategoryAdd);
router.post("/add-food-item", postAddFoodItem);


// Food CRUD:
router.post('/update-food-item/:id', postUpdateFoodItem);
router.get('/delete-food-item/:id', getDeleteFoodItem);
router.get("/get-food-item/:id", getFoodItem);
router.get("/get-food-items", getFoodItems);
router.get("/get-all-cusines", getAllCusines);

//  Food --> Image:

router.post("/add-food-images/:id", postAddFoodImages);

//Add review
router.post('/add-review', postAddReview);
router.post("/update-review/:id", postUpdateReview);
router.get('/delete-review/:id', getDeleteReview)
router.get("/get-all-reviews", getAllReviews);
router.get("/get-review/:id", getReview);

//	Get All restaurant
router.get("/all-restaurants", getAllRestaurants);
// Get Restaurant by name
router.get("/get-restaurant/:name", getRestaurant);
// router.get('/get-favourites',getFavourites)

export default router;
import ErrorHandler from "../utils/ErrorHandler.js";
import ErrorWrapper from "../utils/ErrorWrapper.js";
import Restaurant from "../models/restaurant.js";
import uploadOnCloudinary from "../utils/uploadOnCloudinary.js";
import { uploadBatchOnCloudinary } from "../utils/uploadOnCloudinary.js";


export const postRestaurant = ErrorWrapper(async (req, res, next) => {
    const { name, address, contact } = req.body;
    const email = req.body.email || req.user.email;
    // console.log(req.files);

    if (!email) throw  new ErrorHandler(401,"Please verify youe email and try  again");
    
    const incomingFields = Object.keys(req.body);
    
    //  Identifying the Missing  Fields
    const requiredFields = ['name', 'address', 'contact'];
    const missingFields = requiredFields.filter((field) => !incomingFields.includes(field));

    if (missingFields.length > 0) { // If there are missing fields
        throw new ErrorHandler(401, `Provide missing fields are ${missingFields.join(',')} for add restaurant!`);
    }

    // Checking ki already restaurant hai toh nahi
    let restaurant;
    try {
        restaurant = await Restaurant.findOne({
            $or: [{ name }, { address }]
        });
    } catch (error) {
        throw new ErrorHandler(500, `Error while searching for restaurant!: ${error.message}`);
    }

    if (restaurant) {
        throw new ErrorHandler(401, `Restaurant with name ${name} or address ${address} already exists!`);
    }

    let cloudinaryResponse;
    try {
        cloudinaryResponse = await uploadOnCloudinary(req.files.coverImage.tempFilePath);
    } catch (error) {
        throw new ErrorHandler(500, `Error while uploading image on cloudinary!: ${error.message}`);
    }

    try {
        let newRestaurant = await Restaurant.create({
            name,
            address,
            email,
            contact,
            coverImage: cloudinaryResponse.url,
            ownerId: req.user._id
        })

        res.status(201).json({
            success: true,
            message: 'Restaurant added successfully!',
            data: newRestaurant
        })
    } catch (error) {
        throw new ErrorHandler(500, `Error while adding restaurant!: ${error.message}`);
    }
});

export const postCusineCategoryAdd = ErrorWrapper(async (req, res, next) => {
    let { name, restaurant_name } = req.body;
    name = name.trim().toLowerCase();
    restaurant_name = restaurant_name.trim().toLowerCase();

    let newCategoryList = name.split(',');
    newCategoryList = newCategoryList.map((c)=>c.trim().toLowerCase())
    // console.log("New List:", newCategoryList);
    if (!newCategoryList.length) throw new ErrorHandler(400, "Please enter atleast one category");
    
    try {
        let restaurant = await Restaurant.findOne({
            name: restaurant_name
        });

        if (!restaurant) throw new ErrorHandler(404, "Restaurant not found");

        if (restaurant.email !== req.user.email) throw new ErrorHandler(404, "You are not authorize to add cusine to this restaurant");

        let existingCusines = restaurant.cusines
        let existingCategoryList = existingCusines.map((cusine) => {
            return cusine.category;
        })
        // console.log("Existing List: ",existingCategoryList);

        //  filter already exist category from newCategoryList

        newCategoryList = newCategoryList.filter((category) => !existingCategoryList.includes(category));

        // console.log("Unique Category: ",newCategoryList);

        let newCusines = newCategoryList.map((category) => {
            let newCusine = {
                category: category,
                food: []
            }
            return newCusine;
        })
        restaurant.cusines = [...existingCusines, ...newCusines];
        // console.log("Results : ",restaurant.cusines);
        await restaurant.save();

        res.status(201).json({
            success: true,
            meassage: 'Cusine category added successfully',
            restaurant
        })
    } catch (error) {
        throw new ErrorHandler(500, `Error while adding cusine category!: ${error.message}`);
    }
})

export const postAddFoodItem = ErrorWrapper(async (req, res, next) => {
    let { category, name, price, veg, restaurant_name, description } = req.body;

    // console.log(category, name, price, veg, restaurant_name, description);
    category = category.trim().toLowerCase();
    name = name.trim().toLowerCase();
    price = price.trim().toLowerCase();
    veg = veg.trim().toLowerCase();
    restaurant_name = restaurant_name.trim().toLowerCase();
    description = description.trim().toLowerCase();


    const incomingFields = Object.keys(req.body);
    // console.log(incomingFields);
    
    //  Identifying the Missing  Fields
    const requiredFields = [
		"name",
		"category",
		"price",
		"veg",
		"restaurant_name",
		"description",
    ];
    const missingFields = requiredFields.filter((field) => !incomingFields.includes(field));
    // console.log(missingFields);

    if (missingFields.length > 0) { // If there are missing fields
        throw new ErrorHandler(401, `Provide missing fields are ${missingFields.join(',')} for add food item!`);
    }

     // Checking ki already restaurant hai toh nahi
    let restaurant;
    try {
        restaurant = await Restaurant.findOne({
            name:restaurant_name
        });
    } catch (error) {
        throw new ErrorHandler(500, `Error while searching restaurant for adding food!: ${error.message}`);
    }

    if (!restaurant) {
        throw new ErrorHandler(
			401,
			`Restaurant with name ${restaurant_name} is not exists!`
		);
    }

    if (restaurant.email !== req.user.email) throw new ErrorHandler(404, "You are not authorize to add food to this restaurant");

    //  getting index of category
    let index = -1;
    restaurant.cusines.forEach((cusine, indx) => {
        if (cusine.category === category)
            index = indx;
    })

    if (index == -1) throw new ErrorHandler(404, "This category is not available in this restaurant");

    // console.log("Index; ", index);
    //   Check karo food already hai ya nahi
    let  food;
    food = restaurant.cusines[index]['food'].find((food) => {
        if (food.name == name) return true;
    })

    if(food) throw new ErrorHandler(401, "Food already exists");
    
    let cloudinaryResponse;
    if (req.files.foodImage.tempFilePath) {
        try {
            cloudinaryResponse = await uploadOnCloudinary(req.files.foodImage.tempFilePath);
            // restaurant.cusines[index].images.unshift({ url:cloudinaryResponse.url})
        } catch (error) {
            throw new ErrorHandler(500, `Error while uploading image on cloudinary!: ${error.message}`);
        }
    }

    let newFoodItem = {
        name,
        price,
        veg,
        description,
        images: [{ url:cloudinaryResponse.url}] || []
    }
    restaurant.cusines[index]["food"].push(newFoodItem);

    await restaurant.save();
    
    res.status(200).json({
        message: "Food item added successfully",
        data: restaurant,
    })
    

})

export const postUpdateFoodItem = ErrorWrapper(async (req, res, next) => {
    const { id } = req.params;
    let { category, name, price, description, veg, restaurant_name } = req.body;

    if(category) category = category.trim().toLowerCase();
    if(name) name = name.trim().toLowerCase();
    if(price) price = Number(price);
    if(veg) veg=veg.trim().toLowerCase();
    if(restaurant_name) restaurant_name = restaurant_name.trim().toLowerCase();
    if(description) description = description.trim().toLowerCase();

    try {
        let restaurant = await Restaurant.findOne({
            name: restaurant_name
        });

        if (!restaurant) throw new ErrorHandler(404, "Restaurant not found");

        if (restaurant.email !== req.user.email) throw new ErrorHandler(404, "You are not authorize to update food item of this restaurant");

        const index = restaurant.cusines.findIndex((cusine) => cusine.category === category);

        if (index == -1) throw new ErrorHandler(404, "This category is not available in this restaurant");
        // console.log('Index: ', index);
        const foodIndex = restaurant.cusines[index]["food"].findIndex((food) => food._id.toString() === id.toString());

        if (foodIndex == -1) throw new ErrorHandler(404, "Please provide the correct food_id to update details");
        // console.log("Food Index: ", foodIndex);

        if(name) restaurant.cusines[index]["food"][foodIndex].name = name;
        if(price) restaurant.cusines[index]["food"][foodIndex].price = price;
        if(veg) restaurant.cusines[index]["food"][foodIndex].veg = veg;
        if(description) restaurant.cusines[index]["food"][foodIndex].description = description;

        if(req.files && req.files.foodImage && req.files.foodImage.tempFilePath) {
            let cloudinaryResponse;
            try {
                cloudinaryResponse = await uploadOnCloudinary(req.files.foodImage.tempFilePath);
                restaurant.cusines[index]["food"][foodIndex].images.unshift({ url:cloudinaryResponse.url})
            } catch (error) {
                throw new ErrorHandler(500, `Error while uploading image on cloudinary!: ${error.message}`);
            }
        }
        


        await restaurant.save();

        res.status(200).json({
            message: 'Food Updated Successfully!',
            data: restaurant,
        })
    }
    catch (error) {
        throw new ErrorHandler(500, `Error while updating food item!: ${error.message}`);
    }
})

export const getDeleteFoodItem = ErrorWrapper(async (req, res, next) => {
    const { id } = req.params;
    let { category, restaurant_name } = req.body;

    console.log(category, restaurant_name);

    if(category) category = category.trim().toLowerCase();
    if(restaurant_name) restaurant_name = restaurant_name.trim().toLowerCase();

    try {
        let restaurant = await Restaurant.findOne({
            name: restaurant_name
        });

        if (!restaurant) throw new ErrorHandler(404, "Restaurant not found");

        if (restaurant.email !== req.user.email) throw new ErrorHandler(404, "You are not authorize to delete food item of this restaurant");

        const index = restaurant.cusines.findIndex((cusine) => cusine.category === category);

        if (index == -1) throw new ErrorHandler(404, "This category is not available in this restaurant");
        // console.log('Index: ', index);
        const foodIndex = restaurant.cusines[index]["food"].findIndex((food) => food._id.toString() === id.toString());

        if (foodIndex == -1) throw new ErrorHandler(404, "Please provide the correct food_id to delete food item");
        // console.log("Food Index: ", foodIndex);

        restaurant.cusines[index]["food"].splice(foodIndex, 1);

        await restaurant.save();

        res.status(200).json({
            message: 'Food Item Deleted Successfully!',
            data: restaurant,
        })
    }
    catch (error) {
        throw new ErrorHandler(500, `Error while deleting food item!: ${error.message}`);
    }
})

export const getFoodItem = ErrorWrapper(async (req, res, next) => {
    const { id } = req.params;
    let { category, restaurant_name } = req.body;

    if(category) category = category.trim().toLowerCase();
    if(restaurant_name) restaurant_name = restaurant_name.trim().toLowerCase();

    try {
        let restaurant = await Restaurant.findOne({
            name: restaurant_name
        });

        if (!restaurant) throw new ErrorHandler(404, "Restaurant not found");

        const index = restaurant.cusines.findIndex((cusine) => cusine.category === category);

        if (index == -1) throw new ErrorHandler(404, "This category is not available in this restaurant");
        // console.log('Index: ', index);
        const foodIndex = restaurant.cusines[index]["food"].findIndex((food) => food._id.toString() === id.toString());

        if (foodIndex == -1) throw new ErrorHandler(404, "Please provide the correct food_id to get food item");
        // console.log("Food Index: ", foodIndex);

        let foodItem = restaurant.cusines[index]["food"][foodIndex];

        res.status(200).json({
            message: 'Food Item fetched Successfully!',
            data: foodItem,
        })
    }
    catch (error) {
        throw new ErrorHandler(500, `Error while fetching food item!: ${error.message}`);
    }
})

export const getFoodItems = ErrorWrapper(async (req, res, next) => {
    let { restaurant_name } = req.body;

    if(restaurant_name) restaurant_name = restaurant_name.trim().toLowerCase();

    try {
        let restaurant = await Restaurant.findOne({
            name: restaurant_name
        });

        if (!restaurant) throw new ErrorHandler(404, "Restaurant not found");

        let foodItems = [];
        restaurant.cusines.forEach((cusine) => {
            foodItems = [...foodItems, ...cusine.food];
        })

        res.status(200).json({
            message: 'Food Items fetched Successfully!',
            count: foodItems.length,
            data: foodItems,
        })
    }
    catch (error) {
        throw new ErrorHandler(500, `Error while fetching food items!: ${error.message}`);
    }
})

export const getAllCusines = ErrorWrapper(async (req, res, next) => {
    let { restaurant_name } = req.body;

    if(restaurant_name) restaurant_name = restaurant_name.trim().toLowerCase();

    try {
        let restaurant = await Restaurant.findOne({
            name: restaurant_name
        });

        if (!restaurant) throw new ErrorHandler(404, "Restaurant not found");                   
        let cusines = restaurant.cusines.map((cusine) => cusine.category);
        
        res.status(200).json({  
            message: 'Cusine categories fetched Successfully!',
            count: cusines.length,
            data: cusines,
        })
    }
    catch (error) {
        throw new ErrorHandler(500, `Error while fetching cusine categories!: ${error.message}`);
    }
})

export const postAddFoodImages = ErrorWrapper(async (req, res, next) => {
    const { id } = req.params;
    const { restaurant_name, category } = req.body;
   
    try {
        const restaurant = await Restaurant.findOne({ name: restaurant_name });

        if (!restaurant) {
        throw new ErrorHandler(401,`Restaurant with name ${restaurant_name} is not exists!`);
        }

        if (restaurant.email !== req.user.email) throw new ErrorHandler(404, "You are not authorize to get food to this restaurant");
        // console.log(restaurant);
        //  getting index of category
        const index = restaurant.cusines.findIndex((cusine) => cusine.category === category);

        if (index == -1) throw new ErrorHandler(404, "This category is not available in this restaurant");
        // console.log('Index: ', index);
        const foodIndex = restaurant.cusines[index]["food"].findIndex((food) => food._id.toString() === id.toString());

        if (foodIndex == -1) throw new ErrorHandler(404, "Please provide the correct food_id to add images in food");

        let food = restaurant.cusines[index]['food'][foodIndex];

        const images = req.files;
        if (!images) throw new ErrorHandler(400, "Please provide images!");
        
        let imagesUrls = [];

        const cloudinaryBatchResult = await uploadBatchOnCloudinary(images)
        
        cloudinaryBatchResult.forEach((image) => {
            let imageUrl = {
                url:image.url
            }
            imagesUrls.push(imageUrl);
        })
        
        food.images = [...imagesUrls, ...food.images];

        await restaurant.save();

        res.status(200).json({
            message: 'Image uploaded Successfully!',
            data:food
        })


    } catch (error) {
        throw new ErrorHandler(error.statusCode || 500, error.message);
    }
})

export const postAddReview = ErrorWrapper(async (req, res, next) => {
    const { restaurant_name, message, rating } = req.body;
    const name = req.user.name;
    const userId = req.user._id;
    // console.log(restaurant_name, message, rating);
    try {
        let restaurant = await Restaurant.findOne({name: restaurant_name});
        
        if(!restaurant) throw new ErrorHandler(404, "Restaurant not found");
        
        // console.log(restaurant);
        if (userId.toString() === restaurant.ownerId.toString()) throw new ErrorHandler(400, "You are not authorized to review own restaurant!");
        
        if (Number(rating) < 1 || Number(rating) > 5) throw new ErrorHandler(400, "Please give Valid Rating!");

        if (!message) throw new ErrorHandler(400, 'Please provide review!!!');

        let imageUrls;
        console.log(req.files);
        if (req.files) {
            let cloudinaryResponse = await uploadBatchOnCloudinary(req.files);
            if (!cloudinaryResponse) throw new ErrorHandler(400, "Image upload failed!");

            imageUrls = cloudinaryResponse.map((res) => {
                return {
                    url: res.url
                }
            })            
        } 
        
        const review = {
            username: name,
            rating: +rating,
            message,
            userId,
            images: imageUrls,
            userImage:req.user.image
        }

        restaurant.reviews.unshift(review);
        await restaurant.save();

        res.status(200).json({
			message: "Review added Successfully!",
			restaurant,
		});
        
    } catch (error) {
        throw new ErrorHandler(error.statusCode || 500, error.message);
    }
})

export const postUpdateReview = ErrorWrapper(async (req, res, next) => {
    const { id } = req.params;
    const { restaurant_name, message, rating } = req.body;
    const userId = req.user._id;

    try {
        let restaurant = await Restaurant.findOne({name: restaurant_name});
        
        if(!restaurant) throw new ErrorHandler(404, "Restaurant not found");

        const reviewIndex = restaurant.reviews.findIndex((review) => review._id.toString() === id.toString());

        if (reviewIndex == -1) throw new ErrorHandler(404, "Please provide the correct review_id to update review");

        if (restaurant.reviews[reviewIndex].userId.toString() !== userId.toString()) throw new ErrorHandler(401, "You are not authorized to update this review");

        if (Number(rating) < 1 || Number(rating) > 5) throw new ErrorHandler(400, "Please give Valid Rating!");

        // if (!message) throw new ErrorHandler(400, 'Please provide review!!!');

        if(message) restaurant.reviews[reviewIndex].message = message;
        if(rating) restaurant.reviews[reviewIndex].rating = +rating;

        let imageUrls = [];
        if (req.files) {
            let cloudinaryResponse = await uploadBatchOnCloudinary(req.files);
            if (!cloudinaryResponse) throw new ErrorHandler(400, "Image upload failed!");

            imageUrls = cloudinaryResponse.map((res) => {
                return {
                    url: res.url
                }
            })            
        } 

        restaurant.reviews[reviewIndex].images = [...imageUrls, ...restaurant.reviews[reviewIndex].images];

        await restaurant.save()

        res.status(200).json({
            message: "Review updated Successfully!",
            restaurant,
        });     
    } catch (error) {
        throw new ErrorHandler(error.statusCode || 500, error.message);
    }
})

export const getDeleteReview = ErrorWrapper(async (req, res, next) => {
    const { id } = req.params;
    const { restaurant_name } = req.body;
    const userId = req.user._id;

    try {
        let restaurant = await Restaurant.findOne({name: restaurant_name});
        
        if(!restaurant) throw new ErrorHandler(404, "Restaurant not found");

        const reviewIndex = restaurant.reviews.findIndex((review) => review._id.toString() === id.toString());

        if (reviewIndex == -1) throw new ErrorHandler(404, "Please provide the correct review_id to delete review");

        if (restaurant.reviews[reviewIndex].userId.toString() !== userId.toString()) throw new ErrorHandler(401, "You are not authorized to delete this review");

        restaurant.reviews.splice(reviewIndex, 1);

        await restaurant.save()

        res.status(200).json({
            message: "Review deleted Successfully!",
            restaurant,
        });     
    } catch (error) {       
        throw new ErrorHandler(error.statusCode || 500, error.message);
    }
})

export const getAllRestaurants = ErrorWrapper(async (req, res, next) => {
    try {
        let restaurants = await Restaurant.find({});

        res.status(200).json({
            message: 'Restaurants fetched Successfully!',
            count: restaurants.length,
            restaurants,
        })
    }
    catch (error) {
        throw new ErrorHandler(500, `Error while fetching restaurants!: ${error.message}`);
    }
})

export const getRestaurant = ErrorWrapper(async (req, res, next) => {
    const { name } = req.params;  

    try {
        let restaurant = await Restaurant.findOne({name: name.toLowerCase()});
        if (!restaurant) throw new ErrorHandler(404, "Restaurant not found");

        res.status(200).json({
            message: `Restaurant fetched with name ${name} fetched Successfully!`,
            data: restaurant,
        })
    }
    catch (error) {
        throw new ErrorHandler(500, `Error while fetching restaurant!: ${error.message}`);
    }
})

export const getAllReviews = ErrorWrapper(async (req, res, next) => {
    const { restaurant_name } = req.body;

    try {
        let restaurant = await Restaurant.findOne({name: restaurant_name});
        
        if(!restaurant) throw new ErrorHandler(404, "Restaurant not found");

        if(restaurant.reviews.length===0) throw new ErrorHandler(404, "No reviews found for this restaurant");
        
        res.status(200).json({
            message: 'Reviews fetched Successfully!',
            count: restaurant.reviews.length,
            data: restaurant.reviews,
        })
    } catch (error) {
        throw new ErrorHandler(error.statusCode || 500, error.message);
    }
})

export const getReview = ErrorWrapper(async (req, res, next) => {
    const { id } = req.params;
    const { restaurant_name } = req.body;

    try {
        let restaurant = await Restaurant.findOne({name: restaurant_name});
        
        if(!restaurant) throw new ErrorHandler(404, "Restaurant not found");

        const reviewIndex = restaurant.reviews.findIndex((review) => review._id.toString() === id.toString());

        if (reviewIndex == -1) throw new ErrorHandler(404, "Please provide the correct review_id to get review");

        res.status(200).json({
            message: 'Review fetched Successfully!',
            data: restaurant.reviews[reviewIndex],
        })
    } catch (error) {
        throw new ErrorHandler(error.statusCode || 500, error.message);
    }
})
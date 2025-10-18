import User from "../models/user.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import ErrorWrapper from "../utils/ErrorWrapper.js";
import uploadOnCloudinary from "../utils/uploadOnCloudinary.js";


export const getProfile = ErrorWrapper(async (req, res, next) => {
    try{
        const user = await User.findOne({ _id: req.user._id }).select('-password -refreshToken -updatedAt');
        if(!user) return next(new ErrorHandler("User not found",404));


        res.status(200).json({
            message:"User profile fetched successfully",
            success:true,
            user
        })
    }
    catch (error) {
        throw new ErrorHandler(error.statusCode || 500, error.message);
    }
})

export const postUpdateDetails = ErrorWrapper(async (req, res, next) => {
    try{
        const {name,email,username,password,contact} = req.body;

        let user=await User.findOne({_id:req.user._id});
        if(!user) return next(new ErrorHandler("User not found",404));

        if(name) user.name=name;
        if(email) user.email=email;
        if(username) user.username=username;
        if(password) user.password=password;
        if(contact) user.contact=contact;

        let cloudinaryResponse 
        if (req.files) {
            cloudinaryResponse = await uploadOnCloudinary(req.files.image.tempFilePath)
            user.image = cloudinaryResponse.url;
        }

        await user.save();
        req.user=user;

        res.status(200).json({
            message:"User details updated successfully",
            success:true,
            data:user
        })
    }
    catch (error) {
        throw new ErrorHandler(error.statusCode || 500, error.message);
    }
})

export const postAddAddress = ErrorWrapper(async (req, res, next) => {
    try{
        const {name,location,contact,landmark} = req.body;

        let incomingFields=Object.keys(req.body);

        const requiredFields = ['name', 'location', 'contact', 'landmark'];
        const missingFields = requiredFields.filter((field) => !incomingFields.includes(field));

        if (missingFields.length > 0) { // If there are missing fields
            throw new ErrorHandler(401, `Provide missing fields: ${missingFields.join(',')} for adding addess!`);
        }

        const user = await User.findOne({ _id: req.user._id });

        let newAddress = {
            name,
            contact,
            location,
            landmark
        }

        user.addresses.unshift(newAddress);

        await user.save();
        
        res.status(200).json({
            message: 'Address added successfully!',
            data: user.addresses
        })
    }
    catch (error) {
        throw new ErrorHandler(error.statusCode || 500, error.message);
    }
})

export const postUpdateAddress= ErrorWrapper(async (req, res, next) => {
    try{
        const {name,location,contact,landmark} = req.body;
        const {id}=req.params;

        let incomingFields=Object.keys(req.body);

        const requiredFields = ['name', 'location', 'contact', 'landmark'];
        const missingFields = requiredFields.filter((field) => !incomingFields.includes(field));

        if (missingFields.length > 0) { // If there are missing fields
            throw new ErrorHandler(401, `Provide missing fields: ${missingFields.join(',')} for updating addess!`);
        }

        let user = await User.findOne({ _id: req.user._id });
        if(!user) return next(new ErrorHandler("User not found",404));

        let addressIndex = user.addresses.findIndex(address => address._id.toString() === id);
        if(addressIndex===-1) return next(new ErrorHandler("Address not found",404));

        user.addresses[addressIndex]={
            name,
            contact,
            location,
            landmark
        }

        await user.save();

        res.status(200).json({
            message: 'Address updated successfully!',
            data: user.addresses
        })
    }
    catch (error) {
        throw new ErrorHandler(error.statusCode || 500, error.message);
    }
})

export const getDeleteAddress= ErrorWrapper(async (req, res, next) => {
    try{
        const {id}=req.params;

        let user = await User.findOne({ _id: req.user._id });
        if(!user) return next(new ErrorHandler("User not found",404));

        let addressIndex = user.addresses.findIndex(address => address._id.toString() === id);
        if(addressIndex===-1) return next(new ErrorHandler("Address not found",404));

        user.addresses.splice(addressIndex,1);

        await user.save();

        res.status(200).json({
            message: 'Address deleted successfully!',
            data: user.addresses
        })
    }
    catch (error) {
        throw new ErrorHandler(error.statusCode || 500, error.message);
    }
})

export const getPlaceOrder= ErrorWrapper(async (req, res, next) => {
    try{
        const user = await User.findOne({ _id: req.user._id });
        if(!user) return next(new ErrorHandler("User not found",404));

        if(user.cart.length===0) return next(new ErrorHandler("Cart is empty, add items in cart to place order!",400));
        if(user.addresses.length===0) return next(new ErrorHandler("Add address to place order!",400));

        let totalPrice = 0;
		cart.forEach((cartItem) => {
			let price = cartItem.quantity * cartItem.food.price;
			// console.log(cartItem.food.name, price);
			totalPrice = totalPrice + price;
		});

        let order={
            items:user.cart,
            address:user.addresses[0], // For now taking 1st address, later we can provide option to select address while placing order
            totalPrice
        }

        user.orderHistory.unshift(order);
        user.cart=[];

        await user.save();

        res.status(200).json({
            message: 'Order placed successfully!',
            data: order
        })
    }
    catch (error) {
        throw new ErrorHandler(error.statusCode || 500, error.message);
    }
})

export const getOrderHistory= ErrorWrapper(async (req, res, next) => {
    try{
        const user = await User.findOne({ _id: req.user._id });
        if(!user) return next(new ErrorHandler("User not found",404));

        res.status(200).json({
            message: 'Order history fetched successfully!',
            data: user.orderHistory
        })
    }
    catch (error) {
        throw new ErrorHandler(error.statusCode || 500, error.message);
    }
})


export const getUser= ErrorWrapper(async (req, res, next) => {
    try{
        const user = await User.findOne({ _id: req.user._id }).select('-password -refreshToken -createdAt -updatedAt');
        if(!user) return next(new ErrorHandler("User not found",404));

        res.status(200).json({
            message: 'User fetched successfully!',
            data: user
        })
    }
    catch (error) {
        throw new ErrorHandler(error.statusCode || 500, error.message);
    }
})

export const getAddFavourite = ErrorWrapper(async (req, res, next) => {
    const { id } = req.params;
    // console.log(id);
    try {
        const user = await User.findOne({ _id: req.user._id }).select("-password -refreshToken");
        
        let favRestaurant = {
            restaurantId: id,
        }
        let favIds = user.favourites.map((restaurant) => restaurant.restaurantId)
    
        if (!favIds.includes(id)) user.favourites.unshift(favRestaurant);
        let msg;
        if (favIds.includes(id)) msg = "Restaurant already exists in favourites!"
            
        await user.save();
		res.status(200).json({
            message: msg || "Restaurant added to favourite successfully!!",
            user
		});
    } catch (error) {
		throw new ErrorHandler(error.statusCode || 500, error.message);
    }
})

export const getDeleteFavourite = ErrorWrapper(async (req, res, next) => {
     const { id } = req.params;
	// console.log(id);
	try {
		const user = await User.findOne({ _id: req.user._id }).select("-password -refreshToken");

        let favIds =[];
        user.favourites.forEach((fav) => {
            if (!(fav.restaurantId == id))
                favIds.push(fav);
        });
        
        user.favourites = favIds;
		await user.save();
		res.status(200).json({
            message: "Restaurant removed from favourite successfully!!",
            user
		});
	} catch (error) {
		throw new ErrorHandler(error.statusCode || 500, error.message);
	}
})

export const getLogout = ErrorWrapper(async (req, res) => {
	try {
        const user = await User.findOne({ _id: req.user._id });
        // console.log(user);

		user.refreshToken = '';
		await user.save();

		res.status(200).json({
            success:true,
			message: "You are Logged out successfully!!",
		});
	} 
    catch (error) {
		throw new ErrorHandler(error.statusCode || 500, error.message);
	}
});



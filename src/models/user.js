import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
	{
		username: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
		},
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
		},
		name: {
			type: String,
			required: true,
			lowercase: true,
			trim: true,
		},
		contact: {
			type: Number,
			trim: true,
		}
		,
		image: {
			type: String, // cloudinary url
			required: true,
		},
		addresses: [
			{
				name: {
					type: String,
					lowercase: true,
					trim: true,
					// required: true,
				},
				contact: {
					type: Number,
					lowercase: true,
					trim: true,
					// required: true,
				},
				location: {
					type: String,
					lowercase: true,
					trim: true,
					// required: true,
				},
				landmark: {
					type: String,
					lowercase: true,
					trim: true,
				},
			},
		],
		favourites: [
			{
				restaurantId: String,
			},
		],
		cart: [
			{
				food: {
					type: Object,
				},
				quantity: Number,
				restaurant_name: String,
				category:String
			},
		],
		orderHistory: [
			{
				date: {
					type: Date,
					default: Date.now,
				},
				items: [
					// {
					// 	name: String,
					// 	price: Number,
					// 	quantity: Number,
					// 	id: {
					// 		type: Schema.Types.ObjectId,
					// 		ref: "Restaurant",
					// 	},
					// },
				],
				address: Object,
				totalPrice: Number,
				paymentDetails: Object,
			},
		],
		password: {
			type: String,
			required: true,
		},
		refreshToken: {
			type: String,
		},
	},
	{
		timestamps: true,
	}
);


 // Hashing password before saving in database
userSchema.pre('save', function (next) {
	//	Password change nahi hua to kuch nahi karna hai 
	if (!this.isModified('password')) return next();

	//	Password change hua to hash kardo
	const user = this;
	bcrypt.hash(user.password, 10, (err, hash) => {
		if (err) {
			return next(err);
		}
		user.password = hash;
		next();
	});
});

// Verifying Password for login
userSchema.methods.isPasswordCorrect = async function (enteredPassword) {
	const user = this;

	let result = await bcrypt.compare(enteredPassword, user.password);
	// console.log("Kya Password sahi hai :", result);
	return result;
}

// Generating Refresh Token
userSchema.methods.generateRefreshToken = async function () {
	return jwt.sign(
		{
			userId: this._id
		},
		process.env.REFRESH_TOKEN_KEY,
		{
			expiresIn: process.env.REFRESH_TOKEN_EXPIRY
		}
	);
}

// Generating Access Token
userSchema.methods.generateAccessToken = async function () {
	return jwt.sign(
		{
			userId: this._id,
			email: this.email,
			username: this.username,
			name: this.name,
		},
		process.env.ACCESS_TOKEN_KEY,
		{
			expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
		}
	);
};


const User = mongoose.model("User", userSchema);
export default User;
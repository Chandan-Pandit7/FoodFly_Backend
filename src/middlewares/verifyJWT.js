import jwt from "jsonwebtoken";
import User from "../models/user.js";
import ErrorWrapper from "../utils/ErrorWrapper.js";
import ErrorHandler from "../utils/ErrorHandler.js";

export const verifyjwt = ErrorWrapper(async (req, res, next) => {
	const incomingRefreshToken = req.cookies.RefreshToken;
	const incomingAccessToken = req.cookies.AccessToken;

	// console.log(incomingAccessToken, incomingRefreshToken)

	if (!incomingAccessToken || !incomingRefreshToken) {
		throw new ErrorHandler(401, "You are not authenticated, Please login 1st!");
	}
	try {
		let userInfo = jwt.verify(
			incomingAccessToken,
			process.env.ACCESS_TOKEN_KEY
		);
		let user = await User.findOne({
			_id: userInfo.userId,
		});
		let userRefreshToken = user.refreshToken;
		if (userRefreshToken !== incomingRefreshToken) {
			throw new ErrorHandler(401,"You are not authenticated, Please login 1st & try again!")
		}
		req.user = user;
		next();
	} catch (error) {
		throw new ErrorHandler(500, "Problem in verification of JWT!");
	}
});
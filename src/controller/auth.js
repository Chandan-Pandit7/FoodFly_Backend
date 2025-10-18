import User from "../models/user.js"
import ErrorHandler from "../utils/ErrorHandler.js"
import ErrorWrapper from "../utils/ErrorWrapper.js"
import { AvatarGenerator } from "random-avatar-generator"
import uploadOnCloudinary from "../utils/uploadOnCloudinary.js"

export const postSignup = ErrorWrapper(async (req, res, next) => {

    const { name, username, email, password } = req.body;
    const generator = new AvatarGenerator();

    const incomingFields = Object.keys(req.body);

    const requiredFields = ['username', 'password', 'email', 'name'];
    const missingFields = requiredFields.filter((field) => !incomingFields.includes(field));


    if (missingFields.length > 0) { // If there are missing fields
        throw new ErrorHandler(401, `Provide missing fields are ${missingFields.join(',')} in Signup!`);
    }

    //  Checking User is already exist or not 
    let existingUser = await User.findOne({
        $or: [
            { username },
            {email}
        ]
    })

    if (existingUser) {
        throw new ErrorHandler(401, `User with ${username} or ${email} already exist!`);
    }

    let cloudinaryResponse;

    if (req.files) {
        try {
            cloudinaryResponse = await uploadOnCloudinary(req.files.image.tempFilePath);
        } catch (error) {
            throw new ErrorHandler(500, `Error while uploading image ${error.message}`);
        }
    }

    else {
        // Simply get a random avatar
        let avatar = generator.generateRandomAvatar();
		cloudinaryResponse = {
			secure_url:avatar
		};
    }
    //  Creating new user 
    try {
        const newUser = await User.create({
            username,
            password,
            email,
            name,
            image: cloudinaryResponse.secure_url
        });

        // newUser.save();
        console.log('New User Created Successfully!');

        //  Getting created user and sending user without password
        let user = await User.findOne({
            _id: newUser._id
        }).select('-password');

        res.status(201).json({
            message:"User created successfully!",
            success: true,
            user: user
        })
    } 
    catch (error) {
        throw new ErrorHandler(500, `Error while creating new user ${error.message}`);
    }
})

const generateAccessTokenAndRefreshToken = async (userId) => {
    try {
        let user = await User.findOne({
            _id: userId
        })
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        return {
            accessToken,
            refreshToken
        }
    } catch (error) {
        throw new ErrorHandler(500, `Error while generating access token and refresh token:  ${error.message}`);
    }
}

export const postLogin = ErrorWrapper(async (req, res, next) => {
    const { username, password ,email} = req.body;

    const incomingFields = Object.keys(req.body);

    const requiredFields = ['username', 'email','password'];
    const missingFields = requiredFields.filter((field) => !incomingFields.includes(field));    

    if (missingFields.length > 0) { // If there are missing fields
        throw new ErrorHandler(401, `Provide missing fields are ${missingFields.join(',')} in Login!`);
    }

    //  Checking User is already exist or not 
    let existingUser = await User.findOne(
        {
            $or: [
                { username },
                { email }
            ]
        });

    if (!existingUser) {
        throw new ErrorHandler(401, `User with ${username} does not exist!`);
    }

    //  Verifying Password
    let isPasswordCorrect = await existingUser.isPasswordCorrect(password);

    if (!isPasswordCorrect) {
        throw new ErrorHandler(401, `Password is incorrect!`);
    }

    
    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(existingUser._id);
    
    existingUser.refreshToken = refreshToken;
    
    await existingUser.save();

    existingUser = await User.findOne({
        $or:[{username}, {email}]
    }).select('-password -refreshToken -createdAt -updatedAt');
    let newUser = {
        ...existingUser._doc,
        isLoggedIn: true
    }
    res.status(200)
        .cookie("RefreshToken", refreshToken, {
            httpOnly: false, // Set to false if you need to access the cookie on the frontend
            secure: true, // Required for HTTPS
            sameSite: 'None', // Required for cross-site requests
        })
        .cookie("AccessToken", accessToken, {
            httpOnly: false, // Set to false if you need to access the cookie on the frontend
            secure: true, // Required for HTTPS
            sameSite: 'None', // Required for cross-site requests
        })
        .json({
        message: "Login Successful!",
        success: true,
        user: newUser
    })
})
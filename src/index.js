import express from 'express'
import mongoose from "mongoose"
import cookieParser from "cookie-parser"
import bodyParser from "body-parser"
import cors from "cors"
const app=express();
const PORT=process.env.PORT;
import fileUpload from "express-fileupload"
import serverless from "serverless-http"

import authRouter from "./routes/auth.js"
import cartRouter from "./routes/cart.js"
import restaurantRouter from "./routes/restaurant.js"
import userRouter from "./routes/user.js"
import {verifyjwt} from "./middlewares/verifyJWT.js"
import paymentRouter from './routes/payment.js'

app.use(cors({
    origin:process.env.CORS_ORIGINS,
    credentials: true,
}))

app.use(
	fileUpload({
		limits: { fileSize: 50 * 1024 * 1024 },
		useTempFiles: true,
		tempFileDir: "/tmp/",
	})
);

app.use(cookieParser());
app.use(bodyParser.json({ limit: "4kb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "4kb" }));
app.use(express.static('public'));

app.use('/',authRouter) //done
app.use('/cart', verifyjwt, cartRouter); //done
app.use('/restaurant',verifyjwt,restaurantRouter) //done
app.use('/profile',verifyjwt,userRouter); //done
app.use('/payment',verifyjwt,paymentRouter); //done


mongoose.connect(`${process.env.DB_PATH}/${process.env.DB_NAME}`)
    .then(()=>{
        app.listen(PORT,()=>{
            console.log(`🚀 http://localhost:${PORT}`)
        })
    })
    .catch((error)=>{
        console.error('❌ MongoDB connection error:', error);
    })

// this is my index.js
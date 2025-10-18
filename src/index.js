import express from 'express';
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import cors from "cors";
import fileUpload from "express-fileupload";

import authRouter from "./routes/auth.js";
import cartRouter from "./routes/cart.js";
import restaurantRouter from "./routes/restaurant.js";
import userRouter from "./routes/user.js";
import { verifyjwt } from "./middlewares/verifyJWT.js";
import paymentRouter from './routes/payment.js';

const app = express();

// ✅ Middlewares
app.use(cors({
  origin: process.env.CORS_ORIGINS,
  credentials: true,
}));


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

// ✅ Routes
app.use('/', authRouter);
app.use('/cart', verifyjwt, cartRouter);
app.use('/restaurant', verifyjwt, restaurantRouter);
app.use('/profile', verifyjwt, userRouter);
app.use('/payment', verifyjwt, paymentRouter);

// ✅ Default route (optional)
app.get('/', (req, res) => {
  res.send("🚀 Backend is running on Vercel");
});

// ✅ Mongo connection
mongoose.connect(`${process.env.DB_PATH}/${process.env.DB_NAME}`)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ Mongo Error:", err));

// ❌ REMOVE app.listen()
// ✅ Instead export the app
export default app;

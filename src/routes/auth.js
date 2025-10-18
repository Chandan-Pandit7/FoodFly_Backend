import express from 'express';
import { postSignup,postLogin } from '../controller/auth.js';

const router = express.Router();

router.post('/signup', postSignup);
router.post('/login', postLogin);

export default  router;
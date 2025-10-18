import multer from "multer";
import path from 'path';

const storage = multer.diskStorage({
	
	destination: function (req, file, cb) {
		console.log("Inside Multer Storage"),
		cb(null, `${process.cwd() + "/public/images"}`);
	},
	filename: function (req, file, cb) {
		const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
		cb(null, file.fieldname + "-" + uniqueSuffix+ext);
		console.log('Image Received in Multer!');
	},
});

const upload = multer({ storage });

export default upload;
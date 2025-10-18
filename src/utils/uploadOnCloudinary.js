import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUDNAME,
    api_key: process.env.CLOUDINARY_APIKEY,
    api_secret: process.env.CLOUDINARY_APISECRET
});

const uploadOnCloudinary = async (filePath) => {
    // console.log("FilePath", filePath)
    try {
        if (!filePath) return null;
        
        // console.log('Uploading file to cloudinary...');
        const response = await cloudinary.uploader.upload(filePath);
        
        // console.log("File is uploaded on cloudinary", response.url);
        // fs.unlinkSync(filePath);
        return response;
    }
    catch (error) {
        // fs.unlinkSync(filePath);
        console.error("Error uploading file on cloudinary", err);
        return error;
    }

}

async function uploadBatchOnCloudinary(images) {
    try {
        if (!images) return null;
        console.log("Uploading batch of images to cloudinary...");
        // console.log("images.images: ",images.images);
        // console.log("images ",images);
        const promises = images.images.map(async (image) => {
            const response = await cloudinary.uploader.upload(image.tempFilePath);
            return response;
        })

        const results = await Promise.all(promises);

        console.log("Batch of images uploaded on cloudinary");

        return results;
    } catch (error) {
        throw new ErrorHandler(500, "Error uploading batch of images on cloudinary", error);
    }
}

export default uploadOnCloudinary;
export { uploadBatchOnCloudinary };
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary using environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Cloudinary storage — each field goes to its own folder in your Cloudinary account
const storage = new CloudinaryStorage({
    cloudinary,
    params: (req, file) => {
        let folder = 'mycampusride/misc';
        let resource_type = 'auto'; // 'auto' handles both images and PDFs

        if (file.fieldname === 'profilePicture') {
            folder = 'mycampusride/profiles';
            resource_type = 'image';
        } else if (file.fieldname === 'drivingLicense') {
            folder = 'mycampusride/licenses';
            resource_type = 'raw'; // PDFs must use 'raw'
        } else if (file.fieldname === 'feeReceipt') {
            folder = 'mycampusride/fee-receipts';
            resource_type = 'auto'; // Can be PDF or image
        }

        return {
            folder,
            resource_type,
            // unique public_id using timestamp
            public_id: `${file.fieldname}_${Date.now()}`
        };
    }
});

// File filter — same validation as before
const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'drivingLicense') {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed for driving license'), false);
        }
    } else if (file.fieldname === 'profilePicture') {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files (JPEG, PNG, WEBP) are allowed for profile picture'), false);
        }
    } else if (file.fieldname === 'feeReceipt') {
        if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF or image files (JPEG, PNG, WEBP) are allowed for fee receipt'), false);
        }
    } else {
        cb(new Error('Unexpected field'), false);
    }
};

// Create multer instance with Cloudinary storage
// After upload: req.file.path  → permanent Cloudinary URL (e.g. https://res.cloudinary.com/...)
//               req.file.filename → Cloudinary public_id
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

module.exports = upload;

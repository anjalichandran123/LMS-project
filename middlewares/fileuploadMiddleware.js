import multer from "multer";
import path from "path";

// Configure storage for uploaded files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/"); // Directory to store uploaded files
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, ""); // Remove special characters
        cb(null, `${timestamp}-${sanitizedFilename}`);
    },
});

// File filter for validation (Allow PDF and Excel files)
const fileFilter = (req, file, cb) => {
    // Allowed MIME types for PDF and Excel files (XLSX and XLS)
    const allowedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Invalid file type. Only PDF and Excel files are allowed."));
    }
};

// Multer configuration
const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
});

// Multer error handler
const multerErrorHandler = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ error: "File size exceeds the 5MB limit." });
        } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
            return res.status(400).json({ error: err.message });
        }
    }
    next(err);
};

export { upload, multerErrorHandler };

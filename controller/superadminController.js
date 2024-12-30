import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { BatchModel, CourseModel, LessonModel, ModuleModel, StudentBatch, UserModel } from '../postgres/postgres.js';
import { createCourseModel } from '../models/courseSchema.js';
import { createModuleModel } from '../models/moduleSchema.js';
import { createLessonModel } from '../models/lessonSchema.js';
import { createStudentBatchAssignmentModel } from '../models/StudentBatchAssignmentScema.js';
import { createBatchModel } from '../models/batchSchema.js';
import multer from "multer";
import xlsx from "xlsx";
import fs from "fs";



// Super Admin Login
export const superAdminLogin = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Ensure the email matches the super admin's email from the .env file
        if (email !== process.env.SUPERADMIN_EMAIL) {
            return res.status(403).json({ message: 'Access denied: Not authorized as Super Admin' });
        }

        // Compare the provided password with the hashed super admin password from the .env file
        const isPasswordValid = await bcrypt.compare(password, process.env.SUPERADMIN_PASSWORD);
        if (!isPasswordValid) {
            return res.status(403).json({ message: 'Access denied: Invalid credentials' });
        }

        // Generate a JWT token for the super admin
        const token = jwt.sign(
            { role: 'superadmin', email }, // Payload includes role and email
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRY } // Token expiration time from .env file
        );

        // Return the token and a success message
        return res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
        console.error('Error during login:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// Super Admin  - View All Users
export const viewallusers = async (req, res) => {
    try {
        // Use the imported createUserModel directly
        const users = await UserModel.findAll(); // Ensure this is a valid Sequelize method

        return res.status(200).json({ users });
    } catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};


// dlete a user 
export const deleteUser = async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(403).json({ message: "Unauthorized: Token required" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== "superadmin") {
            return res.status(403).json({ message: "Forbidden: Only superadmins can delete users" });
        }

        const { userId } = req.params;
        const user = await UserModel.findByPk(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        await user.destroy();
        return res.status(200).json({ message: `User ${user.name} deleted successfully` });
    } catch (error) {
        console.error("Error during user deletion:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};




// Admin or Super Admin removes a student from an assigned course
export const removeStudentFromCourse = async (req, res) => {
    const { studentId, batchId } = req.params; // Get student and batch IDs from URL parameters

    try {
        // Check if the logged-in user is an admin or super admin
        if (!req.user || (req.user.role !== "admin" && req.user.role !== "superadmin")) {
            return res.status(403).json({ message: "Forbidden: Only admins or super admins can perform this action" });
        }

        // Find the student-batch assignment
        const studentBatchAssignment = await StudentBatch.findOne({
            where: { student_id: studentId, batch_id: batchId },
        });

        if (!studentBatchAssignment) {
            return res.status(404).json({ message: "Student is not assigned to this batch" });
        }

        // Remove the student from the batch
        await studentBatchAssignment.destroy();

        return res.status(200).json({
            message: `Student with ID ${studentId} removed from batch ${batchId} successfully`,
        });
    } catch (error) {
        console.error("Error removing student from course:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

// Admin or Super Admin removes a teacher from an assigned course
export const removeTeacherFromCourse = async (req, res) => {
    const { teacherId, batchId } = req.params; // Get teacher and batch IDs from URL parameters

    try {
        // Check if the logged-in user is an admin or super admin
        if (!req.user || (req.user.role !== "admin" && req.user.role !== "superadmin")) {
            return res.status(403).json({ message: "Forbidden: Only admins or super admins can perform this action" });
        }

        // Find the teacher-batch assignment
        const teacherBatchAssignment = await TeacherBatch.findOne({
            where: { teacher_id: teacherId, batch_id: batchId },
        });

        if (!teacherBatchAssignment) {
            return res.status(404).json({ message: "Teacher is not assigned to this batch" });
        }

        // Remove the teacher from the batch
        await teacherBatchAssignment.destroy();

        return res.status(200).json({
            message: `Teacher with ID ${teacherId} removed from batch ${batchId} successfully`,
        });
    } catch (error) {
        console.error("Error removing teacher from course:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};



// Approve and update the role of a single user
export const approveUserAndChangeRole = async (req, res) => {
    const { userId, role } = req.body;  // Extracting userId and role from request body
    const token = req.headers.authorization?.split(" ")[1];  // Extract token from Authorization header

    if (!token) {
        return res.status(403).json({ message: "Unauthorized: Token required" });
    }

    if (!userId || !role) {
        return res.status(400).json({ message: "Both userId and role are required" });
    }

    try {
        // Verify the token and check the user's role
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!["superadmin", "admin"].includes(decoded.role)) {
            return res.status(403).json({ message: "Unauthorized: Only admins or superadmins can approve users" });
        }

        // Fetch the user by userId
        const user = await UserModel.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if the user is already approved
        if (user.isApproved) {
            return res.status(400).json({ message: "User is already approved" });
        }

        // Validate the provided role
        const allowedRoles = ["student", "teacher", "admin"];
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ message: `Invalid role. Allowed roles are: ${allowedRoles.join(", ")}` });
        }

        // Update the user's role
        user.role = role;

        // Approve the user
        user.isApproved = true;
        await user.save();  // Save the updated user

        return res.status(200).json({
            message: `User ${user.name} approved and role updated successfully`,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                isApproved: user.isApproved,
            },
        });
    } catch (error) {
        console.error("Error approving user:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};



// Create Course by Super Admin
export const createCourseBySuperAdmin = async (req, res) => {
    const { title, description, startDate, endDate } = req.body;

    // Extract token from Authorization header
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(403).json({ message: "Unauthorized: Superadmin token required" });
    }

    try {
        // Verify the token and ensure the user is a superadmin
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        if (decodedToken.role !== "superadmin") {
            return res.status(403).json({ message: "Unauthorized: Only superadmins can create courses" });
        }

        // Access the Sequelize instance and define the Course model
        const sequelize = req.app.get("sequelize"); // Assuming sequelize is attached to the app object
        const CourseModel = createCourseModel(sequelize); // Create the Course model dynamically

        // Create the course
        const course = await CourseModel.create({
            title,
            description,
            startDate,
            endDate,
        });

        // Return success response
        return res.status(201).json({
            message: "Course created successfully",
            course,
        });
    } catch (error) {
        console.error("Error creating course:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};



// ----------------createmodule-------------------------
export const createModuleBySuperAdmin = async (req, res) => {
    const { title, course_id, contentDetails } = req.body;

    // Extract token from headers
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(403).json({ message: "Unauthorized: Token required" });
    }

    try {
        // Verify token and check role
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== "superadmin") {
            return res.status(403).json({ message: "Unauthorized: Only superadmins can create modules" });
        }

        // Initialize Module model with sequelize instance
        const sequelize = req.app.get("sequelize");
        const ModuleModel = createModuleModel(sequelize);

        // Create a new module
        const module = await ModuleModel.create({
            title,
            course_id,
            contentDetails,
        });

        return res.status(201).json({ message: "Module created successfully", module });
    } catch (error) {
        console.error("Error creating module:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};


// create lesson 
export const createLessonBySuperAdmin = async (req, res) => {
    const { course_id, module_id, contentUrl, contentType } = req.body;

    // Extract token from headers
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(403).json({ message: "Unauthorized: Token required" });
    }

    try {
        // Verify token and check role
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== "superadmin") {
            return res.status(403).json({ message: "Unauthorized: Only superadmins can create lessons" });
        }

        // Initialize models with the sequelize instance
        const sequelize = req.app.get("sequelize");
        const Lesson = createLessonModel(sequelize);
        const Module = createModuleModel(sequelize);
        const Course = createCourseModel(sequelize);

        // Validate required fields
        if (!course_id || !module_id || !contentType) {
            return res.status(400).json({ message: "Course ID, Module ID, and Content Type are required" });
        }

        // Validate contentType
        if (!["pdf", "url", "audio"].includes(contentType)) {
            return res.status(400).json({ message: "Content Type must be 'pdf', 'url', or 'audio'" });
        }

        // Check if the course exists
        const course = await Course.findOne({ where: { id: course_id } });
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        // Check if the module exists under the given course
        const module = await Module.findOne({ where: { id: module_id, course_id } });
        if (!module) {
            return res.status(404).json({ message: "Module not found under the specified course" });
        }

        // Create new lesson
        const newLesson = await Lesson.create({ module_id, contentUrl, contentType, course_id });

        return res.status(201).json({
            message: "Lesson created successfully",
            lesson: newLesson,
        });
    } catch (error) {
        console.error("Error creating lesson:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

// get all courses 
export const getAllCourses = async (req, res) => {
    try {
        const courses = await CourseModel.findAll();
        if (!courses.length) {
            return res.status(404).json({ message: "No courses found" });
        }
        return res.status(200).json({ message: "Courses retrieved successfully", courses });
    } catch (error) {
        console.error("Error retrieving courses:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};


// get all modules 
export const getModulesByCourse = async (req, res) => {
    const { course_id } = req.params;

    try {
        const modules = await ModuleModel.findAll({ where: { course_id } });
        if (!modules.length) {
            return res.status(404).json({ message: "No modules found for this course" });
        }
        return res.status(200).json({ message: "Modules retrieved successfully", modules });
    } catch (error) {
        console.error("Error retrieving modules:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};


// get all lessons under module 

export const getLessonsByModuleAndCourse = async (req, res) => {
    const { course_id, module_id } = req.params;

    try {
        const lessons = await LessonModel.findAll({ where: { course_id, module_id } });
        if (!lessons.length) {
            return res.status(404).json({ message: "No lessons found for this module and course" });
        }
        return res.status(200).json({ message: "Lessons retrieved successfully", lessons });
    } catch (error) {
        console.error("Error retrieving lessons:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};


// update course 
export const updateCourse = async (req, res) => {
    const { course_id } = req.params;
    const { title, description, startDate, endDate } = req.body;

    try {
        const course = await CourseModel.findOne({ where: { id: course_id } });
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        const updatedCourse = await course.update({ title, description, startDate, endDate });
        return res.status(200).json({ message: "Course updated successfully", course: updatedCourse });
    } catch (error) {
        console.error("Error updating course:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};



// update module 
export const updateModule = async (req, res) => {
    const { module_id } = req.params;
    const { course_id, title, contentDetails } = req.body;

    try {
        const module = await ModuleModel.findOne({ where: { id: module_id, course_id } });
        if (!module) {
            return res.status(404).json({ message: "Module not found under the specified course" });
        }

        const updatedModule = await module.update({ title, contentDetails });
        return res.status(200).json({ message: "Module updated successfully", module: updatedModule });
    } catch (error) {
        console.error("Error updating module:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};


// update lessons under module 
export const updateLesson = async (req, res) => {
    const { lesson_id } = req.params;
    const { course_id, module_id, contentUrl, contentType } = req.body;

    try {
        const lesson = await LessonModel.findOne({ where: { id: lesson_id, course_id, module_id } });
        if (!lesson) {
            return res.status(404).json({ message: "Lesson not found under the specified module and course" });
        }

        const updatedLesson = await lesson.update({ contentUrl, contentType });
        return res.status(200).json({ message: "Lesson updated successfully", lesson: updatedLesson });
    } catch (error) {
        console.error("Error updating lesson:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};



// delete perticular course 
export const deleteCourse = async (req, res) => {
    const { course_id } = req.params;

    try {
        const course = await CourseModel.findOne({ where: { id: course_id } });
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        await course.destroy();
        return res.status(200).json({ message: "Course deleted successfully" });
    } catch (error) {
        console.error("Error deleting course:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};


// delete module 
export const deleteModule = async (req, res) => {
    const { course_id, module_id } = req.params;

    try {
        const module = await ModuleModel.findOne({ where: { id: module_id, course_id } });
        if (!module) {
            return res.status(404).json({ message: "Module not found under the specified course" });
        }

        await module.destroy();
        return res.status(200).json({ message: "Module deleted successfully" });
    } catch (error) {
        console.error("Error deleting module:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};


// delete lessons  

export const deleteLesson = async (req, res) => {
    const { course_id, module_id, lesson_id } = req.params;

    try {
        const lesson = await LessonModel.findOne({ where: { id: lesson_id, course_id, module_id } });
        if (!lesson) {
            return res.status(404).json({ message: "Lesson not found under the specified module and course" });
        }

        await lesson.destroy();
        return res.status(200).json({ message: "Lesson deleted successfully" });
    } catch (error) {
        console.error("Error deleting lesson:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};


// create batch

export const createBatchBySuperAdmin = async (req, res) => {
    const { course_id, name } = req.body;

    try {
        // Validate input
        if (!course_id || !name) {
            return res.status(400).json({ message: "Course ID and batch name are required" });
        }

        // Check if the course exists
        const course = await CourseModel.findOne({ where: { id: course_id } });
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        // Ensure only superadmins can create batches
        if (req.user.role !== "superadmin") {
            return res.status(403).json({ message: "Forbidden: Only super admins can create batches" });
        }

        // Create the batch under the course
        const batch = await BatchModel.create({
            course_id,
            name,
        });

        return res.status(201).json({
            message: "Batch created successfully by super admin",
            batch,
        });
    } catch (error) {
        console.error("Error creating batch:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

//delete batch by admin ,superadmin

export const deleteBatch = async (req, res) => {
    const { batchId } = req.params; // Extract batch ID from request parameters

    try {
        // Ensure the user has the required role
        if (!["superadmin", "admin"].includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden: Only admins or super admins can delete batches" });
        }

        // Check if the batch exists
        const batch = await BatchModel.findByPk(batchId);
        if (!batch) {
            return res.status(404).json({ message: "Batch not found" });
        }

        // Delete the batch
        await batch.destroy();

        return res.status(200).json({
            message: "Batch deleted successfully",
            deletedBatch: {
                id: batch.id,
                name: batch.name,
                course_id: batch.course_id,
            },
        });
    } catch (error) {
        console.error("Error deleting batch:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};



//update batch by admin and superadmin

export const updateBatch = async (req, res) => {
    const { batchId } = req.params; // Batch ID from route params
    const { name, start_date, end_date } = req.body; // Fields to update

    try {
        // Ensure the user has the required role
        if (!["superadmin", "admin"].includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden: Only admins or super admins can update batches" });
        }

        // Find the batch by ID
        const batch = await BatchModel.findByPk(batchId);
        if (!batch) {
            return res.status(404).json({ message: "Batch not found" });
        }

        // Validate start_date and end_date (if provided)
        if (start_date && isNaN(new Date(start_date).getTime())) {
            return res.status(400).json({ message: "Invalid start_date format" });
        }

        if (end_date && isNaN(new Date(end_date).getTime())) {
            return res.status(400).json({ message: "Invalid end_date format" });
        }

        if (start_date && end_date && new Date(start_date) >= new Date(end_date)) {
            return res.status(400).json({ message: "start_date must be earlier than end_date" });
        }

        // Update the batch
        batch.name = name || batch.name;
        batch.start_date = start_date || batch.start_date;
        batch.end_date = end_date || batch.end_date;

        await batch.save(); // Save changes to the database

        return res.status(200).json({
            message: "Batch updated successfully",
            batch: {
                id: batch.id,
                name: batch.name,
                course_id: batch.course_id,
                start_date: batch.start_date,
                end_date: batch.end_date,
            },
        });
    } catch (error) {
        console.error("Error updating batch:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};




//bulk upload for registering.....

// Configure Multer for file uploads
const upload = multer({ dest: "uploads/" });

// Middleware for uploading a file
export const uploadFile = upload.single("file");

// Bulk Upload Handler for User Registration
export const bulkUploadBySuperAdmin = async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(403).json({ message: "Unauthorized: Token required" });
    }

    try {
        // Verify token and check role
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== "superadmin") {
            return res.status(403).json({ message: "Unauthorized: Only superadmins can upload files" });
        }

        // Ensure a file is uploaded
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const filePath = req.file.path;

        // Read the Excel file using the xlsx package
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0]; // Get the first sheet
        const sheet = workbook.Sheets[sheetName];

        // Parse the sheet data to JSON
        const results = xlsx.utils.sheet_to_json(sheet);

        // Debug: Log the parsed results
        console.log("Parsed Excel Data:", results);

        if (results.length === 0) {
            return res.status(400).json({ message: "No data found in the uploaded file" });
        }

        // Valid roles to check
        const validRoles = ["admin", "user", "superadmin", "student"];

        // Process each record in the results
        const userPromises = results.map(async (userData, index) => {
            // Log each row's user data for debugging
            console.log(`Processing User ${index + 1}:`, userData);

            const { name, email, role, password } = userData;

            // Check if any required field is missing (including password)
            if (!name || !email || !role || !password) {
                console.log(`Missing required fields in row ${index + 1}. Data:`, userData);  // Debugging log
                // throw new Error(`Missing required fields in row ${index + 1}`);
            }

            // Validate role
            if (!validRoles.includes(role)) {
                console.log(`Invalid role for user ${email}:`, role);  // Debugging log
                throw new Error(`Invalid role ${role} for email ${email}`);
            }

            // Check if the user already exists
            const existingUser = await UserModel.findOne({ where: { email } });
            if (existingUser) {
                console.log(`User with email ${email} already exists. Skipping...`);
                return;  // Skip creating the user if they already exist
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10); // Hash password with 10 salt rounds

            // Save the new user to the database
            return await UserModel.create({
                name,
                email,
                role,
                password: hashedPassword, // Store the hashed password
                isApproved: true,  // Assuming users are approved by default
            });
        });

        // Wait for all user registrations to complete
        await Promise.all(userPromises);

        // Delete the uploaded file after processing
        fs.unlinkSync(filePath);

        return res.status(200).json({
            message: "Users registered successfully",
            data: results, // You can send the parsed data as a response
        });
    } catch (error) {
        console.error("Error during file upload:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};



//upload pdf under the lesson


export const uploadPdfUnderLesson = async (req, res) => {
  const { course_id, module_id, lesson_id } = req.body;

  // Extract token from headers
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(403).json({ message: "Unauthorized: Token required" });
  }

  try {
    // Verify token and check role
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!["superadmin", "admin", "teacher"].includes(decoded.role)) {
      return res.status(403).json({ message: "Unauthorized: Only superadmins, admins, or teachers can upload PDFs" });
    }

    // Validate file upload
    if (!req.file) {
      return res.status(400).json({ message: "PDF file is required for upload" });
    }

    const pdfPath = `/uploads/${req.file.filename}`; // Get the uploaded file path

    // Initialize models with the sequelize instance
    const sequelize = req.app.get("sequelize");
    const Lesson = createLessonModel(sequelize);
    const Module = createModuleModel(sequelize);
    const Course = createCourseModel(sequelize);

    // Validate required fields
    if (!course_id || !module_id || !lesson_id) {
      return res.status(400).json({ message: "Course ID, Module ID, and Lesson ID are required" });
    }

    // Check if the course exists
    const course = await Course.findOne({ where: { id: course_id } });
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check if the module exists under the given course
    const module = await Module.findOne({ where: { id: module_id, course_id } });
    if (!module) {
      return res.status(404).json({ message: "Module not found under the specified course" });
    }

    // Check if the lesson exists under the given module
    const lesson = await Lesson.findOne({ where: { id: lesson_id, module_id } });
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found under the specified module" });
    }

    // Update lesson with PDF content
    lesson.contentUrl = pdfPath;
    lesson.contentType = 'pdf';
    await lesson.save();

    return res.status(200).json({
      message: "PDF uploaded successfully and linked to the lesson",
      lesson,
    });
  } catch (error) {
    console.error("Error uploading PDF:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

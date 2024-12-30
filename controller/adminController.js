import sequelize from "../config/sequelize.js"; // Ensure sequelize instance is imported
import { createCourseModel } from "../models/courseSchema.js";
import { createModuleModel } from "../models/moduleSchema.js";
import { createLessonModel } from "../models/lessonSchema.js";
import { BatchModel, CourseModel, StudentBatch, UserModel,TeacherBatch, LessonModel,ModuleModel } from "../postgres/postgres.js";
import bcrypt from "bcrypt"
import { createAssignmentModel } from "../models/assignmentSchema.js";
import { createBatchModel } from "../models/batchSchema.js";
import jwt from "jsonwebtoken"

// Controller to fetch all registered users, teachers, and students
export const getAllRegisteredUsers = async (req, res) => {
    try {
        // Fetch all users with role `teacher`
        const teachers = await UserModel.findAll({ where: { role: "teacher" } });

        // Fetch all users with role `student`
        const students = await UserModel.findAll({ where: { role: "student" } });

        // Combine results
        const result = {
            teachers,
            students,
        };

        return res.status(200).json({
            message: "Successfully retrieved all registered roles",
            data: result,
        });
    } catch (error) {
        console.error("Error fetching registered users by roles:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};



// create a new user and assign the specific role 

export const createUser = async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        // Validate input
        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: "All fields are required: name, email, password, role" });
        }

        // Validate role
        const validRoles = ["student", "teacher"];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: `Invalid role. Valid roles are: ${validRoles.join(", ")}` });
        }

        // Check if the user already exists
        const existingUser = await UserModel.findOne({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ message: "User with this email already exists" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const newUser = await UserModel.create({
            name,
            email,
            password: hashedPassword,
            role,
            isApproved: true, // Automatically approve the user (can be adjusted as needed)
        });

        return res.status(201).json({
            message: "User created successfully",
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                isApproved: newUser.isApproved,
                createdAt: newUser.createdAt,
            },
        });
    } catch (error) {
        console.error("Error creating user:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};




//approve user
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



// -------createcourse-------

const Course = createCourseModel(sequelize); // Initialize model once

export const createCourse = async (req, res) => {
    const { title, description, startDate, endDate } = req.body;

    try {
        // Validate required fields
        if (!title || !startDate || !endDate) {
            return res.status(400).json({ message: "Title, startDate, and endDate are required" });
        }

        // Create course
        const newCourse = await Course.create({ title, description, startDate, endDate });

        return res.status(201).json({
            message: "Course created successfully",
            course: newCourse,
        });
    } catch (error) {
        console.error("Error creating course:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};


// -------createmodule--------

const Module = createModuleModel(sequelize); // Initialize the model

export const createModule = async (req, res) => {
    const { title, course_id, contentDetails } = req.body;

    try {
        // Validate required fields
        if (!title || !course_id) {
            return res.status(400).json({ message: "Title and course_id are required" });
        }

        // Create new module
        const newModule = await Module.create({ title, course_id, contentDetails });

        return res.status(201).json({
            message: "Module created successfully",
            module: newModule,
        });
    } catch (error) {
        console.error("Error creating module:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};


// --------createlesson---------
const Lesson = createLessonModel(sequelize); 

export const createLesson = async (req, res) => {
    const { course_id, module_id, contentUrl, contentType } = req.body;

    try {
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


// ---------get all courses---------

// Endpoint to get all courses
export const getAllCourses = async (req, res) => {
    try {
        // Retrieve all courses from the database
        const courses = await Course.findAll();

        if (courses.length === 0) {
            return res.status(404).json({ message: "No courses found" });
        }

        return res.status(200).json({
            message: "Courses retrieved successfully",
            courses: courses,
        });
    } catch (error) {
        console.error("Error retrieving courses:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};


// -------view module under a course-------

// Endpoint to get all modules under a specific course
export const getModulesByCourse = async (req, res) => {
    const { course_id } = req.params; // Retrieve course_id from URL params

    try {
        // Validate that course_id is provided
        if (!course_id) {
            return res.status(400).json({ message: "Course ID is required" });
        }

        // Retrieve all modules for the given course_id
        const modules = await Module.findAll({
            where: { course_id },
        });

        if (modules.length === 0) {
            return res.status(404).json({ message: "No modules found for this course" });
        }

        return res.status(200).json({
            message: "Modules retrieved successfully",
            modules: modules,
        });
    } catch (error) {
        console.error("Error retrieving modules:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};


// ---------view all lessons under the module--------

// Endpoint to get all lessons under a specific module and course
export const getLessonsByModuleAndCourse = async (req, res) => {
    const { course_id, module_id } = req.params; // Extract course_id and module_id from URL parameters

    try {
        // Validate that course_id and module_id are provided
        if (!course_id || !module_id) {
            return res.status(400).json({ message: "Course ID and Module ID are required" });
        }

        // Retrieve all lessons for the given module_id and course_id
        const lessons = await Lesson.findAll({
            where: { course_id, module_id },
        });

        if (lessons.length === 0) {
            return res.status(404).json({ message: "No lessons found for this module and course" });
        }

        return res.status(200).json({
            message: "Lessons retrieved successfully",
            lessons: lessons,
        });
    } catch (error) {
        console.error("Error retrieving lessons:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};



// ----------update course-----------

export const updateCourse = async (req, res) => {
    const { course_id } = req.params; // Use course_id as the URL parameter
    const { title, description, startDate, endDate } = req.body;

    try {
        // Validate required fields
        if (!title || !startDate || !endDate) {
            return res.status(400).json({ message: "Title, startDate, and endDate are required" });
        }

        // Find the course by course_id
        const course = await Course.findOne({ where: { id: course_id } });

        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        // Update the course details
        const updatedCourse = await course.update({
            title,
            description,
            startDate,
            endDate,
        });

        return res.status(200).json({
            message: "Course updated successfully",
            course: updatedCourse,
        });
    } catch (error) {
        console.error("Error updating course:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};


// --------update module---------



export const updateModule = async (req, res) => {
    const { module_id } = req.params; // Get module_id from URL params
    const { course_id, title, contentDetails } = req.body; // Get course_id, title, and contentDetails from the request body

    try {
        // Validate required fields
        if (!title || !course_id) {
            return res.status(400).json({ message: "Title and course_id are required" });
        }

        // Find the module by its module_id
        const module = await Module.findOne({ where: { id: module_id } });

        if (!module) {
            return res.status(404).json({ message: "Module not found" });
        }

        // Check if the module belongs to the provided course_id
        if (module.course_id !== course_id) {
            return res.status(400).json({ message: "Module does not belong to the specified course" });
        }

        // Update the module details
        const updatedModule = await module.update({
            title,
            contentDetails,  // Update content details
        });

        return res.status(200).json({
            message: "Module updated successfully",
            module: updatedModule,
        });
    } catch (error) {
        console.error("Error updating module:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};



// -------------update lessons--------

export const updateLesson = async (req, res) => {
    const { lesson_id } = req.params; // Get lesson_id from URL params
    const { course_id, module_id, contentUrl, contentType } = req.body; // Get course_id, module_id, contentUrl, and contentType from the request body

    try {
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

        // Find the lesson by its ID
        const lesson = await Lesson.findOne({ where: { id: lesson_id, module_id, course_id } });
        if (!lesson) {
            return res.status(404).json({ message: "Lesson not found" });
        }

        // Update the lesson
        const updatedLesson = await lesson.update({
            contentUrl,  // Update contentUrl
            contentType  // Update contentType
        });

        return res.status(200).json({
            message: "Lesson updated successfully",
            lesson: updatedLesson,
        });
    } catch (error) {
        console.error("Error updating lesson:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};


// ------------deletecourse-------------

export const deleteCourse = async (req, res) => {
    const { course_id } = req.params; // Get course_id from URL params

    try {
        // Check if the course exists
        const course = await Course.findOne({ where: { id: course_id } });
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        // Delete the course
        await course.destroy();

        return res.status(200).json({
            message: "Course deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting course:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};


// ---------delete module-----------

export const deleteModule = async (req, res) => {
    const { course_id, module_id } = req.params; // Get course_id and module_id from URL params

    try {
        // Check if the course exists
        const course = await Course.findOne({ where: { id: course_id } });
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        // Check if the module exists under the course
        const module = await Module.findOne({ where: { id: module_id, course_id } });
        if (!module) {
            return res.status(404).json({ message: "Module not found under the specified course" });
        }

        // Delete the module
        await module.destroy();

        return res.status(200).json({
            message: "Module deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting module:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};


// ------------delete lesson----------


export const deleteLesson = async (req, res) => {
    const { course_id, module_id, lesson_id } = req.params; // Get course_id, module_id, and lesson_id from URL params

    try {
        // Check if the course exists
        const course = await Course.findOne({ where: { id: course_id } });
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        // Check if the module exists under the course
        const module = await Module.findOne({ where: { id: module_id, course_id } });
        if (!module) {
            return res.status(404).json({ message: "Module not found under the specified course" });
        }

        // Check if the lesson exists under the module
        const lesson = await Lesson.findOne({ where: { id: lesson_id, module_id, course_id } });
        if (!lesson) {
            return res.status(404).json({ message: "Lesson not found under the specified module and course" });
        }

        // Delete the lesson
        await lesson.destroy();

        return res.status(200).json({
            message: "Lesson deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting lesson:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};



// Admin deletes a user
export const deleteUser = async (req, res) => {
    const { userId } = req.params; // Get the user ID from the URL parameters

    try {
        // Check if the logged-in user is an admin
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({ message: "Forbidden: Only admins can delete users" });
        }

        // Find the user by ID
        const user = await UserModel.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Delete the user
        await user.destroy();

        return res.status(200).json({
            message: `User with ID ${userId} deleted successfully`,
        });
    } catch (error) {
        console.error("Error deleting user:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};


// Admin rejects a user (marking as inactive)
export const rejectUser = async (req, res) => {
    const { userId } = req.params; // Get the user ID from the URL parameters

    try {
        // Check if the logged-in user is an admin
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({ message: "Forbidden: Only admins can reject users" });
        }

        // Find the user by ID
        const user = await UserModel.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update the user's status to 'rejected' or 'inactive'
        user.status = "rejected"; // Assuming the User model has a `status` column
        await user.save();

        return res.status(200).json({
            message: `User with ID ${userId} has been rejected successfully`,
        });
    } catch (error) {
        console.error("Error rejecting user:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};




// create batch under the course 

export const createBatchByAdmin = async (req, res) => {
    const { course_id, name, start_date, end_date } = req.body;

    try {
        // Validate input - Ensure start_date and end_date are provided
        if (!course_id || !name || !start_date || !end_date) {
            return res.status(400).json({ message: "Course ID, batch name, start date, and end date are required" });
        }

        // Parse and validate start_date and end_date
        const parsedStartDate = new Date(start_date);
        const parsedEndDate = new Date(end_date);

        if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
            return res.status(400).json({ message: "Invalid date format for start_date or end_date" });
        }

        if (parsedStartDate >= parsedEndDate) {
            return res.status(400).json({ message: "End date must be later than start date" });
        }

        // Check if the course exists
        const course = await CourseModel.findOne({ where: { id: course_id } });
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        // Ensure only admins or superadmins can create batches
        if (req.user.role !== "superadmin" && req.user.role !== "admin") {
            return res.status(403).json({ message: "Forbidden: Only admins or superadmins can create batches" });
        }

        // Create the batch under the course
        const batch = await BatchModel.create({
            course_id,
            name,
            start_date: parsedStartDate,  // Valid start date
            end_date: parsedEndDate,      // Valid end date
        });

        return res.status(201).json({
            message: "Batch created successfully",
            batch,
        });
    } catch (error) {
        console.error("Error creating batch:", error);
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

//assign to batch 
export const assignToBatch = async (req, res) => {
    const { user_id, batch_id, course_id, role } = req.body;

    try {
        // Validate input
        if (!user_id || !batch_id || !course_id || !role) {
            return res.status(400).json({ message: "User ID, Batch ID, Course ID, and Role are required" });
        }

        // Check if the course exists
        const course = await CourseModel.findOne({ where: { id: course_id } });
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        // Check if the batch exists and belongs to the course
        const batch = await BatchModel.findOne({ where: { id: batch_id, course_id } });
        if (!batch) {
            return res.status(404).json({ message: "Batch not found or does not belong to the specified course" });
        }

        // Ensure only admins or superadmins can assign
        const admin = req.user;

        // Debugging: Log the authenticated user
        console.log("Authenticated user:", admin);

        if (!admin || !["admin", "super_admin"].includes(admin.role)) {
            return res.status(403).json({
                message: "Unauthorized. Only admins or super admins can assign users to batches.",
            });
        }

        // Handle assignment based on the role
        if (role === "student") {
            // Check if the student exists
            const student = await UserModel.findOne({ where: { id: user_id, role: "student" } });
            if (!student) {
                return res.status(404).json({ message: "Student not found" });
            }

            // Check if the student is already assigned to this batch under the course
            const existingAssignment = await StudentBatch.findOne({
                where: { student_id: user_id, batch_id },
            });
            if (existingAssignment) {
                return res.status(400).json({ message: "Student is already assigned to this batch under the course" });
            }

            // Assign the student to the batch
            const assignment = await StudentBatch.create({
                student_id: user_id,
                batch_id,
            });

            return res.status(201).json({
                message: "Student successfully assigned to the batch",
                assignment,
            });

        } else if (role === "teacher") {
            // Check if the teacher exists
            const teacher = await UserModel.findOne({ where: { id: user_id, role: "teacher" } });
            if (!teacher) {
                return res.status(404).json({ message: "Teacher not found" });
            }

            // Check if the teacher is already assigned to this batch
            const existingAssignment = await TeacherBatch.findOne({
                where: { teacher_id: user_id, batch_id },
            });
            if (existingAssignment) {
                return res.status(400).json({ message: "Teacher is already assigned to this batch" });
            }

            // Create the teacher-batch assignment
            const newAssignment = await TeacherBatch.create({
                teacher_id: user_id,
                batch_id,
                assigned_by: admin.id, // Record the admin who performed the assignment
            });

            return res.status(200).json({
                message: "Teacher successfully assigned to the batch",
                data: {
                    teacher_id: newAssignment.teacher_id,
                    batch_id: newAssignment.batch_id,
                    course_id,
                    assigned_by: newAssignment.assigned_by,
                },
            });
        } else {
            return res.status(400).json({ message: "Invalid role. Must be 'student' or 'teacher'." });
        }

    } catch (error) {
        console.error("Error assigning user to batch:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};



// --------- Lesson Approval by Admin/Superadmin ---------
export const approveLessonUpdate = async (req, res) => {
    const { lesson_id } = req.body;
    const { role } = req.user; // Role is extracted from authenticated user

    try {
        // Check if the user is an admin or superadmin
        if (!["admin", "superadmin"].includes(role)) {
            return res.status(403).json({ message: "Access denied. Only admin or superadmin can approve lesson updates." });
        }

        // Find the lesson by ID
        const lesson = await Lesson.findOne({ where: { id: lesson_id } });
        if (!lesson) {
            return res.status(404).json({ message: "Lesson not found" });
        }

        // Approve the lesson update
        lesson.isApproved = true; // Set approval flag to true
        await lesson.save();

        return res.status(200).json({
            message: "Lesson update approved successfully.",
            lesson,
        });
    } catch (error) {
        console.error("Error approving lesson update:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};


//create assignment under the lesson

export const assignAssignment = async (req, res) => {
    const { course_id, module_id, lesson_id, batch_id, title, contentType, dueDate } = req.body;

    const sequelize = req.app.get("sequelize");
    const Assignment = createAssignmentModel(sequelize);
    const Lesson = createLessonModel(sequelize);
    const Batch = createBatchModel(sequelize);

    try {
        // Validate batch and lesson existence
        const batch = await Batch.findByPk(batch_id);
        if (!batch) {
            return res.status(404).json({ message: "Batch not found" });
        }

        const lesson = await Lesson.findOne({ where: { id: lesson_id, module_id, course_id } });
        if (!lesson) {
            return res.status(404).json({ message: "Lesson not found" });
        }

        // Validate due date
        const parsedDueDate = new Date(dueDate);
        if (isNaN(parsedDueDate.getTime())) {
            return res.status(400).json({ message: "Invalid due date format" });
        }
        if (parsedDueDate <= new Date()) {
            return res.status(400).json({ message: "Due date must be in the future" });
        }

        let contentUrl = null;

        if (contentType === "pdf") {
            // Handle file upload
            upload(req, res, async (err) => {
                if (err) {
                    return res.status(400).json({ message: err.message });
                }
                contentUrl = `/uploads/${req.file.filename}`;

                const assignment = await Assignment.create({
                    course_id,
                    module_id,
                    lesson_id,
                    batch_id,
                    title,
                    contentType,
                    contentUrl,
                    submissionLink: `/api/assignments/submit/${batch_id}/${lesson_id}`,
                    dueDate: parsedDueDate, // Include due date
                });

                return res.status(200).json({ message: "Assignment created successfully", assignment });
            });
        } else if (contentType === "typed") {
            const { content } = req.body;

            const assignment = await Assignment.create({
                course_id,
                module_id,
                lesson_id,
                batch_id,
                title,
                contentType,
                contentUrl: content,
                submissionLink: `/api/assignments/submit/${batch_id}/${lesson_id}`,
                dueDate: parsedDueDate, // Include due date
            });

            return res.status(200).json({ message: "Assignment created successfully", assignment });
        } else {
            return res.status(400).json({ message: "Invalid content type" });
        }
    } catch (error) {
        console.error("Error assigning assignment:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};


// Delete Assignment
export const deleteAssignment = async (req, res) => {
    const { assignmentId } = req.params; // Extract assignment ID from request parameters
    const token = req.headers.authorization?.split(" ")[1]; // Extract token from Authorization header

    if (!token) {
        return res.status(403).json({ message: "Unauthorized: Token required" });
    }

    try {
        // Verify the token and extract user information
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if the user has the required role
        if (!["superadmin", "admin", "teacher"].includes(decoded.role)) {
            return res.status(403).json({ message: "Forbidden: Only authorized roles can delete assignments" });
        }

        // Fetch the assignment by ID
        const sequelize = req.app.get("sequelize");
        const Assignment = createAssignmentModel(sequelize);

        const assignment = await Assignment.findByPk(assignmentId);
        if (!assignment) {
            return res.status(404).json({ message: "Assignment not found" });
        }

        // Delete the assignment
        await assignment.destroy();

        return res.status(200).json({ message: "Assignment deleted successfully" });
    } catch (error) {
        console.error("Error deleting assignment:", error);
        if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
            return res.status(403).json({ message: "Unauthorized: Invalid or expired token" });
        }
        return res.status(500).json({ message: "Internal server error" });
    }
};

import sequelize from "../config/sequelize.js";
import { createTeacherBatchAssignmentModel } from "../models/TeacherBatchAssignmentSchema.js";
import jwt from "jsonwebtoken";
import { createSubmissionModel } from "../models/submitassignment.js";
import {
    UserModel,
    BatchModel,
    CourseModel,
    ModuleModel,
    LessonModel,
    TeacherBatch,
    StudentBatch,
    
} from "../postgres/postgres.js";

// View courses under assigned batches for a teacher along with modules and lessons
export const viewTeacherAssignedCourses = async (req, res) => {
    const { teacher_id } = req.params;

    try {
        // Validate input
        if (!teacher_id) {
            return res.status(400).json({ message: "Teacher ID is required." });
        }

        // Verify teacher existence
        const teacher = await UserModel.findOne({
            where: { id: teacher_id, role: "teacher" },
        });

        if (!teacher) {
            return res.status(404).json({ message: "Teacher not found." });
        }

        // Fetch assigned batches for the teacher
        const assignedBatches = await TeacherBatch.findAll({
            where: { teacher_id },
            include: [
                {
                    model: BatchModel,
                    as: "batch",
                    include: [
                        {
                            model: CourseModel,
                            as: "course",
                            include: [
                                {
                                    model: ModuleModel,
                                    as: "modules",
                                    include: [
                                        {
                                            model: LessonModel,
                                            as: "lessons",
                                            attributes: ["id", "contentUrl", "contentType"],
                                        },
                                    ],
                                    attributes: ["id", "title","contentDetails"],
                                },
                            ],
                            attributes: ["id", "title", "description"],
                        },
                    ],
                    attributes: ["id", "name", "start_date", "end_date"],
                },
            ],
        });

        if (!assignedBatches.length) {
            return res.status(404).json({ message: "No assigned batches found for this teacher." });
        }

        // Transform data for the response
        const result = assignedBatches.map((assignment) => {
            const batch = assignment.batch;
            const course = batch.course;

            return {
                batch_id: batch.id,
                batch_name: batch.name,
                start_date: batch.start_date,
                end_date: batch.end_date,
                course: {
                    course_id: course.id,
                    course_title: course.title,
                    course_description: course.description,
                    modules: course.modules.map((module) => ({
                        module_id: module.id,
                        module_title: module.title,
                        module_description: module.contentDetails,
                        lessons: module.lessons.map((lesson) => ({
                            lesson_id: lesson.id,
                            lesson_contentUrl: lesson.contentUrl,
                            lesson_contentType: lesson.contentType,
                        })),
                    })),
                },
            };
        });

        return res.status(200).json({
            message: "Courses retrieved successfully.",
            data: result,
        });
    } catch (error) {
        console.error("Error fetching assigned courses:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};



// --------- Create Lesson (Teacher Uploads Content) ---------
export const uploadLesson = async (req, res) => {
    const { course_id, module_id, contentUrl, contentType } = req.body;

    try {
        // Validate required fields
        if (!course_id || !module_id || !contentType) {
            return res
                .status(400)
                .json({ message: "Course ID, Module ID, and Content Type are required" });
        }

        // Validate contentType
        if (!["pdf", "url", "audio"].includes(contentType)) {
            return res
                .status(400)
                .json({ message: "Content Type must be 'pdf', 'url', or 'audio'" });
        }

        // Check if the course exists
        const course = await CourseModel.findOne({ where: { id: course_id } });
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        // Check if the module exists under the given course
        const module = await ModuleModel.findOne({ where: { id: module_id, course_id } });
        if (!module) {
            return res.status(404).json({ message: "Module not found under the specified course" });
        }

        // Create a new lesson with approval status set to false by default
        const newLesson = await LessonModel.create({
            module_id,
            contentUrl,
            contentType,
            course_id,
            isApproved: false, // Lesson is not approved initially
        });

        return res.status(201).json({
            message: "Lesson uploaded successfully and is pending admin approval",
            lesson: newLesson,
        });
    } catch (error) {
        console.error("Error uploading lesson:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};



// Controller method to fetch all students in the same batch as the teacher
// Example controller method
export const getStudentsInSameBatch = async (req, res) => {
    const teacherId = req.params.teacherId;

    try {
        // Find teacher's batch assignments
        const teacherBatchAssignments = await TeacherBatch.findAll({
            where: { teacher_id: teacherId },
            include: {
                model: BatchModel,
                as: 'batch', // Alias for batch in TeacherBatchAssignment
                attributes: ['id', 'name'], // Fetch the batch name and id
            },
        });

        if (teacherBatchAssignments.length === 0) {
            return res.status(404).json({ error: 'No batches found for this teacher' });
        }

        const batchIds = teacherBatchAssignments.map(assignment => assignment.batch.id);

        // Now, fetch students who belong to the same batches
        const students = await UserModel.findAll({
            where: { role: 'student' }, // Make sure you're only fetching students
            include: {
                model: StudentBatch,
                as: 'studentBatches', // Alias for the relationship in the User model
                where: { batch_id: batchIds }, // Filter by batch IDs
                include: {
                    model: BatchModel,
                    as: 'batch', // Include the batch itself to get batch details
                    attributes: ['id', 'name'],
                },
            },
        });

        return res.json(students);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// View submitted assignments for a given batch and module
export const viewSubmittedAssignments = async (req, res) => {
    const { batch_id, module_id } = req.params; // Extract batch ID and module ID from the URL
    const token = req.headers.authorization?.split(" ")[1]; // Extract token from Authorization header

    if (!token) {
        return res.status(403).json({ message: "Unauthorized: Token required" });
    }

    try {
        // Verify the token and check the user's role
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!["superadmin", "admin", "teacher"].includes(decoded.role)) {
            return res.status(403).json({ message: "Unauthorized: Only admins, superadmins, or teachers can view assignments" });
        }

        const sequelize = req.app.get("sequelize");
        const Submission = createSubmissionModel(sequelize);

        // Fetch all submissions for the given batch and module
        const submissions = await Submission.findAll({
            where: { 
                batch_id, 
                module_id // Now filtering by module_id instead of lesson_id
            },
        });

        if (!submissions || submissions.length === 0) {
            return res.status(404).json({ message: "No submissions found for the specified batch and module" });
        }

        return res.status(200).json({ message: "Submissions retrieved successfully", submissions });
    } catch (error) {
        console.error("Error fetching submitted assignments:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};



//given feedback of submission

export const provideFeedback = async (req, res) => {
    const { submission_id } = req.params; // Extract submission ID from the URL
    const { feedback } = req.body; // Extract feedback from the request body
    const token = req.headers.authorization?.split(" ")[1]; // Extract token from Authorization header

    if (!token) {
        return res.status(403).json({ message: "Unauthorized: Token required" });
    }

    try {
        // Verify the token and check the user's role
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!["superadmin", "admin", "teacher"].includes(decoded.role)) {
            return res.status(403).json({ message: "Unauthorized: Only admins, superadmins, or teachers can provide feedback" });
        }

        const sequelize = req.app.get("sequelize");
        const Submission = createSubmissionModel(sequelize);

        // Find the submission by its ID
        const submission = await Submission.findByPk(submission_id);

        if (!submission) {
            return res.status(404).json({ message: "Submission not found" });
        }

        // Update the submission with feedback
        submission.feedback = feedback;
        await submission.save();

        return res.status(200).json({
            message: "Feedback provided successfully",
            submission: {
                id: submission.id,
                assignment_id: submission.assignment_id,
                student_id: submission.student_id,
                feedback: submission.feedback,
                contentUrl: submission.contentUrl,
            },
        });
    } catch (error) {
        console.error("Error providing feedback:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

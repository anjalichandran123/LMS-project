import { UserModel, StudentBatch, BatchModel, CourseModel,ModuleModel ,QuizModel,AssignmentModel,LessonModel} from "../postgres/postgres.js";
import { createSubmissionModel } from "../models/submitassignment.js";
import { createAssignmentModel } from "../models/assignmentSchema.js";
import { createLessonModel } from "../models/lessonSchema.js";
import { createStudentBatchAssignmentModel } from "../models/StudentBatchAssignmentScema.js";
import { createBatchModel } from "../models/batchSchema.js";
import createFeedbackModel from "../models/feedbackSchema.js";



// Student retrieves their assigned courses
export const getAssignedCoursesForStudent = async (req, res) => {
    const { student_id } = req.params; // student_id is passed as a path parameter

    try {
        // Validate input
        if (!student_id) {
            return res.status(400).json({ message: "Student ID is required" });
        }

        // Check if the student exists
        const student = await UserModel.findOne({ where: { id: student_id, role: "student" } });
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }
 
        // Retrieve all assigned batches and their courses for the student
        const assignedCourses = await StudentBatch.findAll({
            where: { student_id },
            include: [
                {
                    model: BatchModel,
                    as: "batch", // Alias defined in the association
                    include: [
                        {
                            model: CourseModel,
                            as: "course", // Alias defined in the BatchModel's association
                        },
                    ],
                },
            ],
        });

        // If no courses are assigned
        if (assignedCourses.length === 0) {
            return res.status(404).json({ message: "No courses assigned to the student" });
        }

        // Format the response to include relevant course details
        const courses = assignedCourses.map((assignment) => ({
            course_id: assignment.batch.course.id,
            course_title: assignment.batch.course.title,
            batch_id: assignment.batch.id,
            batch_title: assignment.batch.name, // Assuming name is the batch title
        }));

        return res.status(200).json({
            message: "Courses assigned to the student",
            courses,
        });
    } catch (error) {
        console.error("Error fetching assigned courses for student:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};



// Student retrieves their assigned modules within courses with module locking logic
export const getAssignedModulesForStudent = async (req, res) => {
    const { student_id } = req.params; // `student_id` is passed as a path parameter

    try {
        // Validate input
        if (!student_id) {
            return res.status(400).json({ message: "Student ID is required" });
        }

        // Check if the student exists
        const student = await UserModel.findOne({ where: { id: student_id, role: "student" } });
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        // Retrieve all assigned batches and their courses/modules for the student
        const assignedData = await StudentBatch.findAll({
            where: { student_id },
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
                                            model: QuizModel,
                                            as: "quizzes", // Assuming each module has a quiz
                                        },
                                        {
                                            model: AssignmentModel,
                                            as: "assignments", // Assuming each module has an assignment
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        });

        // If no modules are assigned
        if (assignedData.length === 0) {
            return res.status(404).json({ message: "No modules assigned to the student" });
        }

        // Format the response with locking logic
        const modules = assignedData.flatMap((assignment) => {
            const { batch } = assignment;
            const { course } = batch || {};
            if (!course || !course.modules) return [];

            // Sort modules by sequence or ID (ensure modules are ordered correctly)
            const sortedModules = course.modules.sort((a, b) => a.id - b.id);

            let unlocked = true; // Initially, the first module of all courses is unlocked

            return sortedModules.map((module, index) => {
                // Check if the quiz and assignment for the previous module are submitted
                if (index > 0) {
                    const prevModule = sortedModules[index - 1];
                    const quizCompleted = prevModule.quiz && prevModule.quiz.status === "submitted";
                    const assignmentCompleted = prevModule.assignment && prevModule.assignment.status === "submitted";
                    unlocked = quizCompleted && assignmentCompleted;
                }

                return {
                    course_id: course.id,
                    course_title: course.title,
                    batch_id: batch.id,
                    batch_title: batch.name, // Assuming `name` is the batch title
                    module_id: module.id,
                    module_title: module.title,
                    unlocked,
                };
            });
        });

        if (modules.length === 0) {
            return res.status(404).json({ message: "No modules found in the assigned courses" });
        }

        return res.status(200).json({
            message: "Modules assigned to the student with locking logic",
            modules,
        });
    } catch (error) {
        console.error("Error fetching assigned modules for student:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};



// Student retrieves lessons for a specific module under a particular course
export const getLessonsForModule = async (req, res) => {
    const { course_id, module_id } = req.params; // `course_id` and `module_id` are passed as path parameters
    const student_id = req.user.id; // Assuming `req.user.id` contains the logged-in student's ID (from authentication middleware)

    try {
        // Validate input
        if (!course_id || !module_id) {
            return res.status(400).json({ message: "Course ID and Module ID are required" });
        }

        // Check if the student exists
        const student = await UserModel.findOne({ where: { id: student_id, role: "student" } });
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        // Retrieve the specified course, module, and lessons
        const course = await CourseModel.findOne({
            where: { id: course_id },
            include: [
                {
                    model: ModuleModel,
                    as: "modules", // Alias for the modules in the CourseModel
                    where: { id: module_id }, // Filter to get only the requested module
                    include: [
                        {
                            model: LessonModel,
                            as: "lessons", // Alias for the lessons in the ModuleModel
                        },
                    ],
                },
            ],
        });

        // If no course or module found
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }
        if (course.modules.length === 0) {
            return res.status(404).json({ message: "Module not found" });
        }

        const module = course.modules[0]; // Get the first (and only) module

        // Retrieve all lessons under the module
        const lessons = module.lessons.map((lesson) => {
            return {
                course_id: course.id,
                course_title: course.title,
                module_id: module.id,
                module_title: module.title,
                lesson_id: lesson.id,
                video_url: lesson.contentUrl, // Assuming `contentUrl` is the URL for the lesson's video or content
            };
        });

        if (lessons.length === 0) {
            return res.status(404).json({ message: "No lessons found in the specified module" });
        }

        return res.status(200).json({
            message: "Lessons retrieved successfully for the module",
            lessons,
        });
    } catch (error) {
        console.error("Error fetching lessons for module:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};



// Get lesson content for students (including uploaded PDF)
export const getLessonContentpdf = async (req, res) => {
    const { course_id, module_id, lesson_id } = req.params; // Extract parameters from route
  
    const sequelize = req.app.get("sequelize"); // Get sequelize instance
    const Lesson = createLessonModel(sequelize); // Lesson model
  
    try {
      // Check if the lesson exists under the given module and course
      const lesson = await Lesson.findOne({
        where: {
          id: lesson_id,
          module_id,
          course_id,
        },
        attributes: ['id', 'contentUrl', 'contentType', 'createdAt'], // Return relevant fields
      });
  
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }
  
      // Check if the lesson contains PDF content
      if (lesson.contentType === 'pdf') {
        return res.status(200).json({
          message: "Lesson content found",
          lesson: {
            id: lesson.id,
            contentUrl: lesson.contentUrl, // The PDF path
            contentType: lesson.contentType,
          },
        });
      } else {
        return res.status(200).json({
          message: "Lesson content found (No PDF)",
          lesson: {
            id: lesson.id,
            contentType: lesson.contentType,
          },
        });
      }
  
    } catch (error) {
      console.error("Error retrieving lesson content:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
  


// Get assigned assignments for a student under a module
export const getAssignmentsForStudent = async (req, res) => {
    const { module_id, student_id } = req.params; // Module ID and Student ID from route parameters

    const sequelize = req.app.get("sequelize");
    const Assignment = createAssignmentModel(sequelize);
    const StudentBatch = createStudentBatchAssignmentModel(sequelize); // Link between students and batches
    const Batch = createBatchModel(sequelize);

    try {
        // Get the batch associated with the student
        const studentBatch = await StudentBatch.findOne({ where: { student_id } });
        if (!studentBatch) {
            return res.status(404).json({ message: "Student is not assigned to any batch" });
        }

        // Find assignments for the module and the student's batch
        const assignments = await Assignment.findAll({
            where: {
                module_id,
                batch_id: studentBatch.batch_id,
            },
            attributes: [
                'id',
                'title',
                'contentType',
                'contentUrl',
                'submissionLink',
                'createdAt',
                'dueDate' // Include dueDate for assignments
            ], // Fields to return
        });

        if (assignments.length === 0) {
            return res.status(404).json({ message: "No assignments found for this module" });
        }

        // Add view time information to each assignment
        const assignmentsWithViewTime = assignments.map((assignment) => {
            const currentDate = new Date();
            const dueDate = new Date(assignment.dueDate);
            const timeRemaining = dueDate - currentDate; // Calculate time remaining until the due date

            return {
                ...assignment.dataValues,
                viewTime: timeRemaining > 0 ? `${Math.floor(timeRemaining / (1000 * 60 * 60 * 24))} days remaining` : 'Past Due', // Assign time remaining if due date is in the future
            };
        });

        return res.status(200).json({
            message: "Assignments retrieved successfully",
            assignments: assignmentsWithViewTime,
        });
    } catch (error) {
        console.error("Error retrieving assignments:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Assignment submission
export const submitAssignment = async (req, res) => {
    const { batch_id, module_id } = req.params; // Extract batch ID and module ID from URL parameters
    const { student_id } = req.body; // Extract student ID from the request body

    const sequelize = req.app.get("sequelize"); // Get the sequelize instance from the app
    const Submission = createSubmissionModel(sequelize); // Create the Submission model
    const Assignment = createAssignmentModel(sequelize); // Create the Assignment model to get the due date

    try {
        // Validate input
        if (!student_id) {
            return res.status(400).json({ message: "Student ID is required" });
        }

        if (!req.file) {
            return res.status(400).json({ message: "File is required for assignment submission" });
        }

        const contentUrl = `/uploads/${req.file.filename}`; // Path to the uploaded file

        // Get the assignment details to check the due date under the module
        const assignment = await Assignment.findOne({
            where: {
                batch_id,
                module_id, // Now searching by module_id instead of lesson_id
            },
        });

        if (!assignment) {
            return res.status(404).json({ message: "Assignment not found for this module" });
        }

        // Get the current date and the due date of the assignment
        const currentDate = new Date();
        const dueDate = new Date(assignment.dueDate); // Assuming 'dueDate' exists in the assignment

        // Check if the submission is before or after the due date
        let submissionStatus = "on time";
        let message = "Assignment submitted successfully";

        if (currentDate > dueDate) {
            submissionStatus = "late";
            message = "Due date has passed. Your submission is late.";
        }

        // Save the submission record in the database
        const submission = await Submission.create({
            assignment_id: assignment.id, // Use the assignment ID
            student_id, // Store the student ID
            batch_id, // Include the batch ID for tracking
            contentUrl,
            status: submissionStatus, // Store whether the submission was on time or late
        });

        return res.status(200).json({
            message: message,
            submission: {
                id: submission.id,
                assignment_id: submission.assignment_id,
                student_id: submission.student_id,
                batch_id: submission.batch_id,
                contentUrl: submission.contentUrl,
                status: submission.status, // Include submission status (on time or late)
            },
        });
    } catch (error) {
        console.error("Error submitting assignment:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// student can view the given feedback

export const viewFeedbackForStudent = async (req, res) => {
    const { student_id } = req.params; // Extract the student ID from route parameters
    const sequelize = req.app.get("sequelize");
    const Submission = createSubmissionModel(sequelize);

    try {
        // Fetch all submissions for the student with feedback
        const submissionsWithFeedback = await Submission.findAll({
            where: { student_id },
            attributes: ["assignment_id", "contentUrl", "feedback", "submittedAt"],
        });

        if (submissionsWithFeedback.length === 0) {
            return res
                .status(404)
                .json({ message: "No submissions or feedback found for this student." });
        }

        return res.status(200).json({
            message: "Feedback fetched successfully.",
            feedback: submissionsWithFeedback,
        });
    } catch (error) {
        console.error("Error fetching feedback for student:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};


//given feedback to lesson

export const postLessonFeedback = async (req, res) => {
    const { lesson_id } = req.params;
    const { feedback_text, rating } = req.body;
    const student_id = req.user.id;  // Assuming student_id is available from user authentication

    const sequelize = req.app.get("sequelize");  // Access the sequelize instance
    const Feedback = createFeedbackModel(sequelize);
    // Log the models to check if Feedback is available
    console.log(sequelize.models);  // This should print the Feedback model


    if (!Feedback) {
        return res.status(500).json({ message: "Feedback model not initialized." });
    }

    try {
        // Create the feedback record
        const feedback = await Feedback.create({
            lesson_id,
            student_id,
            feedback_text,
            rating,
        });

        return res.status(201).json({
            message: "Feedback submitted successfully.",
            feedback,
        });
    } catch (error) {
        console.error("Error submitting feedback:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};

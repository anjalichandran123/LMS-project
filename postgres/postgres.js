import { Sequelize } from "sequelize";
import { createUserModel } from "../models/userSchema.js";
import { createCourseModel } from "../models/courseSchema.js";
import { createModuleModel } from "../models/moduleSchema.js";
import { createLessonModel } from "../models/lessonSchema.js";
import { createBatchModel } from "../models/batchSchema.js";
import { defineAssociations } from "../associations.js"; // Import the associations function
import { createStudentBatchAssignmentModel } from "../models/StudentBatchAssignmentScema.js";
import { createStudentProgressModel } from "../models/studentprogressSchema.js";
import { createTeacherBatchAssignmentModel } from "../models/TeacherBatchAssignmentSchema.js";
import { createAssignmentModel } from "../models/assignmentSchema.js";
import { createSubmissionModel } from "../models/submitassignment.js";
import { createQuestionModel } from "../models/questionSchema.js";
import { createLessonCompletionModel } from "../models/lessoncompltionschema.js";
import { createQuizModel } from "../models/quizSchema.js";
import { createStudentAnswerModel } from "../models/quizattemptSchema.js";
import createFeedbackModel from "../models/feedbackSchema.js";
import {createLiveClassLinkModel} from "../models/liveclassSchema.js"
import {createNotificationModel} from "../models/notificationSchema.js"

let sequelize;

export let UserModel;
export let CourseModel;
export let ModuleModel;
export let LessonModel;
export let BatchModel;
export let StudentBatch;
export let StudentProgressModel;
export let TeacherBatch;
export let AssignmentModel;
export let SubmissionModel;
export let QuizModel;
export let LessonCompletion;
export let QuestionModel;
export let AnswerModel;
export let Feedback;
export let Liveclass;
export let Notification;


export const Connection = async () => {
    try {
        // Initialize Sequelize instance
        sequelize = new Sequelize("LMS", "postgres", "1234", {
            host: "localhost",
            dialect: "postgres", // Adjust this if you're using a different database
        });

        // Test the connection
        await sequelize.authenticate();
        console.log("Database connected successfully!");

        // Initialize models
        UserModel = createUserModel(sequelize);
        CourseModel = createCourseModel(sequelize);
        ModuleModel = createModuleModel(sequelize);
        LessonModel = createLessonModel(sequelize);
        BatchModel = createBatchModel(sequelize);
        StudentBatch = createStudentBatchAssignmentModel(sequelize);
        StudentProgressModel=createStudentProgressModel(sequelize);
        TeacherBatch=createTeacherBatchAssignmentModel(sequelize);
        AssignmentModel=createAssignmentModel(sequelize);
        SubmissionModel=createSubmissionModel(sequelize);
        QuizModel=createQuizModel(sequelize);
        LessonCompletion=createLessonCompletionModel(sequelize);
        QuestionModel=createQuestionModel(sequelize);
        AnswerModel=createStudentAnswerModel(sequelize);
        Feedback=createFeedbackModel(sequelize);
        Liveclass=createLiveClassLinkModel(sequelize);
        Notification=createNotificationModel(sequelize);

        // Define associations between models
        defineAssociations(sequelize);

        // Sync models with the database
        await sequelize.sync({ alter: true });
        console.log("Models synchronized successfully!");
    } catch (error) {
        console.error("Database connection failed:", error);
        throw error;
    }
};

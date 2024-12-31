import express from "express"
import { authenticateStudent } from "../middlewares/studentMiddleware.js";
import { createLessonCompletion,
    getQuizForModule,
    getQuestionsForQuiz,
    submitStudentAnswer,
    getTotalMarksForQuiz
     } from "../controller/quizzController.js";

import { getLiveClassLinkAndNotifications } from "../controller/liveclassController.js";
import { upload } from "../middlewares/fileuploadMiddleware.js";
import { 
    getAssignedCoursesForStudent,
    getAssignedModulesForStudent,
    getLessonsForModule,
    submitAssignment,
    viewFeedbackForStudent,
    getAssignmentsForStudent,
    getLessonContentpdf,
    postLessonFeedback,
} from "../controller/studentController.js";

const studentRouter=express.Router()


studentRouter.get("/getAssignedCoursesForStudent/:student_id",authenticateStudent,getAssignedCoursesForStudent);
studentRouter.get("/getAssignedModulesForStudent/:student_id",authenticateStudent,getAssignedModulesForStudent);
studentRouter.get("/course/:course_id/modules/:module_id/getLessonsForModule",authenticateStudent,getLessonsForModule);
studentRouter.get("/module/:module_id/students/:student_id/getAssignmentsForStudent",authenticateStudent,getAssignmentsForStudent);
studentRouter.get("/:student_id/viewFeedbackForStudent",authenticateStudent,viewFeedbackForStudent);
studentRouter.get("/getLessonContentpdf/:course_id/:module_id/:lesson_id",authenticateStudent,getLessonContentpdf);
studentRouter.get("/getQuestionsForQuiz/:course_id/:module_id/student/:student_id",authenticateStudent,getQuizForModule);
studentRouter.get("/:course_id/:module_id/:quiz_id/:student_id/getQuestionsForQuiz",authenticateStudent,getQuestionsForQuiz);
studentRouter.get("/getTotalMarksForQuiz/:quiz_id/marks/:student_id",authenticateStudent,getTotalMarksForQuiz);
studentRouter.get("/getLiveClassLinkAndNotifications/:course_id/:batch_id",authenticateStudent,getLiveClassLinkAndNotifications);

studentRouter.post("/submitStudentAnswer",authenticateStudent,submitStudentAnswer);
studentRouter.post("/createLessonCompletion",authenticateStudent,createLessonCompletion);
studentRouter.post("/submitAssignment/:batch_id/:module_id",upload.single("file"),authenticateStudent,submitAssignment);
studentRouter.post("/lessons/:lesson_id/postLessonFeedback",authenticateStudent,postLessonFeedback);

export default studentRouter;
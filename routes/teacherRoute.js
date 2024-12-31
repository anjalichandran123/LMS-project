import express from "express"
import { authenticateTeacher } from "../middlewares/teacherMiddleware.js"
import { upload } from "../middlewares/fileuploadMiddleware.js";
import { uploadPdfUnderLesson } from "../controller/superadminController.js";
import { assignAssignment,
    deleteAssignment,
 } from "../controller/adminController.js";
import { postLiveClassLink } from "../controller/liveclassController.js";
import { createQuiz,
    createQuestion,
    updateQuestion,
    getQuestionsByQuiz,
    deleteQuestion,
    getStudentMarksByBatch,
} from "../controller/quizzController.js";
import { viewTeacherAssignedCourses,
    uploadLesson,
    getStudentsInSameBatch,
    viewSubmittedAssignments,
    provideFeedback
 } from "../controller/teacherController.js"

const teacherrouter = express.Router();

teacherrouter.get("/viewTeacherAssignedCourses/:teacher_id",authenticateTeacher,viewTeacherAssignedCourses);
teacherrouter.get("/:teacherId/getStudentsInSameBatch",authenticateTeacher,getStudentsInSameBatch);
teacherrouter.get("/viewSubmittedAssignments/submissions/:batch_id/:module_id",authenticateTeacher,viewSubmittedAssignments);
teacherrouter.get("/getQuestionsByQuiz/:quiz_id/questions",authenticateTeacher,getQuestionsByQuiz);
teacherrouter.get("/getStudentMarksByBatch/batch/:batch_id/quiz/:quiz_id",authenticateTeacher,getStudentMarksByBatch);


teacherrouter.post("/postLiveClassLink",authenticateTeacher,postLiveClassLink);
teacherrouter.post("/createQuiz",authenticateTeacher,createQuiz);
teacherrouter.post("/createQuestion",authenticateTeacher,createQuestion);
teacherrouter.post("/uploadLesson",authenticateTeacher,uploadLesson);
teacherrouter.post("/uploadPdfUnderLesson",upload.single("file"),authenticateTeacher,uploadPdfUnderLesson);
teacherrouter.post("/assignAssignment",authenticateTeacher,assignAssignment);
teacherrouter.post("/provideFeedback/feedback/:submission_id",authenticateTeacher,provideFeedback);


teacherrouter.put("/updateQuestion/:quiz_id/question/:question_id",authenticateTeacher,updateQuestion);


teacherrouter.delete("/deleteQuestion/:quiz_id/question/:question_id",authenticateTeacher,deleteQuestion);
teacherrouter.delete("/deleteAssignment/:assignmentId",authenticateTeacher,deleteAssignment);

export default teacherrouter;
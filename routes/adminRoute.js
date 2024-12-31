import express from "express";
import { authenticateAdminOrSuperAdmin } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/fileuploadMiddleware.js";
import { createQuiz,
     createQuestion,
     updateQuestion,
     getQuestionsByQuiz,
     deleteQuestion,
     getStudentMarksByBatch,
 } from "../controller/quizzController.js";

import { uploadPdfUnderLesson,
     deleteBatch,
     updateBatch,
 } from "../controller/superadminController.js";
import { postLiveClassLink } from "../controller/liveclassController.js";
import { provideFeedback,
     viewSubmittedAssignments } from "../controller/teacherController.js";
import { createCourse,
     createUser,
     createBatchByAdmin,
     assignToBatch,
     approveUserAndChangeRole,
     createModule,
     createLesson,
     getAllCourses,
     getModulesByCourse,
     getLessonsByModuleAndCourse,
     updateCourse,
     updateModule,
     updateLesson,
     getAllRegisteredUsers,
     approveLessonUpdate,
     deleteCourse,
     deleteModule,
     deleteLesson,
     deleteUser,
     rejectUser,
     removeStudentFromCourse,
     removeTeacherFromCourse,
     assignAssignment,
     deleteAssignment,
     } from "../controller/adminController.js";

const adminrouter = express.Router();

adminrouter.post("/createCourse", authenticateAdminOrSuperAdmin, createCourse);
adminrouter.post("/createModule",authenticateAdminOrSuperAdmin,createModule);
adminrouter.post("/createLesson",authenticateAdminOrSuperAdmin,createLesson);
adminrouter.post("/createUser",authenticateAdminOrSuperAdmin,createUser);
adminrouter.post("/approveUser",authenticateAdminOrSuperAdmin,approveUserAndChangeRole);
adminrouter.post("/createBatchByAdmin",authenticateAdminOrSuperAdmin,createBatchByAdmin);
adminrouter.post("/assignToBatch",authenticateAdminOrSuperAdmin,assignToBatch);
adminrouter.post("/lessons/approveLessonUpdate",authenticateAdminOrSuperAdmin,approveLessonUpdate);
adminrouter.post("/uploadPdfUnderLesson",upload.single("file"),authenticateAdminOrSuperAdmin,uploadPdfUnderLesson);
adminrouter.post("/assignAssignment",authenticateAdminOrSuperAdmin,assignAssignment);
adminrouter.post("/provideFeedback/feedback/:submission_id",authenticateAdminOrSuperAdmin,provideFeedback);
adminrouter.post("/createQuiz",authenticateAdminOrSuperAdmin,createQuiz);
adminrouter.post("/createQuestion",authenticateAdminOrSuperAdmin,createQuestion);
adminrouter.post("/postLiveClassLink",authenticateAdminOrSuperAdmin,postLiveClassLink);


adminrouter.get("/getStudentMarksByBatch/batch/:batch_id/quiz/:quiz_id",authenticateAdminOrSuperAdmin,getStudentMarksByBatch);
adminrouter.get("/getQuestionsByQuiz/:quiz_id/questions",authenticateAdminOrSuperAdmin,getQuestionsByQuiz);
adminrouter.get("/getAllCourses",authenticateAdminOrSuperAdmin,getAllCourses);
adminrouter.get("/courses/:course_id/getModulesByCourse",authenticateAdminOrSuperAdmin,getModulesByCourse);
adminrouter.get("/courses/:course_id/modules/:module_id/getLessonsByModuleAndCourse",authenticateAdminOrSuperAdmin,getLessonsByModuleAndCourse);
adminrouter.get("/getAllRegisteredUsers",authenticateAdminOrSuperAdmin,getAllRegisteredUsers);
adminrouter.get("/viewSubmittedAssignments/submissions/:batch_id/:module_id",authenticateAdminOrSuperAdmin,viewSubmittedAssignments);


adminrouter.put("/updateQuestion/:quiz_id/question/:question_id",authenticateAdminOrSuperAdmin,updateQuestion);
adminrouter.put("/:course_id/updateCourse",updateCourse);
adminrouter.put("/modules/:module_id/updateModule",updateModule);
adminrouter.put("/lessons/:lesson_id/updateLesson",updateLesson);
adminrouter.put("/user/:userId/rejectUser",authenticateAdminOrSuperAdmin,rejectUser);
adminrouter.put("/updateBatch/:batchId",authenticateAdminOrSuperAdmin,updateBatch);


adminrouter.delete("/deleteQuestion/:quiz_id/question/:question_id",authenticateAdminOrSuperAdmin,deleteQuestion);
adminrouter.delete("/deleteUser/:userId",authenticateAdminOrSuperAdmin,deleteUser);
adminrouter.delete("/courses/:course_id", authenticateAdminOrSuperAdmin, deleteCourse);
adminrouter.delete("/courses/:course_id/modules/:module_id", authenticateAdminOrSuperAdmin, deleteModule);
adminrouter.delete("/courses/:course_id/modules/:module_id/lessons/:lesson_id", authenticateAdminOrSuperAdmin, deleteLesson);
adminrouter.delete("/removeStudentFromCourse/:studentId/:batchId",authenticateAdminOrSuperAdmin,removeStudentFromCourse);
adminrouter.delete("/removeTeacherFromCourse/:teacherId/:batchId",authenticateAdminOrSuperAdmin,removeTeacherFromCourse);
adminrouter.delete("/deleteAssignment/:assignmentId",authenticateAdminOrSuperAdmin,deleteAssignment);
adminrouter.delete("/deleteBatch/:batchId",authenticateAdminOrSuperAdmin,deleteBatch);


export default adminrouter;

import express from "express";
import { authenticateAdminOrSuperAdmin } from "../middlewares/authMiddleware.js";
import { createQuiz,
    createQuestion,
    updateQuestion,
    getQuestionsByQuiz,
    deleteQuestion,
    getStudentMarksByBatch,
} from "../controller/quizzController.js";
import { upload,multerErrorHandler } from "../middlewares/fileuploadMiddleware.js";
import { provideFeedback,
    viewSubmittedAssignments, } from "../controller/teacherController.js";
import { postLiveClassLink } from "../controller/liveclassController.js";
import { assignToBatch,
    assignAssignment,
    approveLessonUpdate,
    deleteAssignment} from "../controller/adminController.js";
import { superAdminLogin, 
    viewallusers,
    approveUserAndChangeRole,
    deleteUser,
    createCourseBySuperAdmin,
    createModuleBySuperAdmin,
    createLessonBySuperAdmin,
    getAllCourses,
    getModulesByCourse,
    getLessonsByModuleAndCourse,
    updateCourse,
    updateModule,
    updateLesson,
    deleteCourse,
    deleteModule,
    deleteLesson,
    createBatchBySuperAdmin,
    removeStudentFromCourse,
    removeTeacherFromCourse,
    bulkUploadBySuperAdmin,
    uploadPdfUnderLesson,
    deleteBatch,
    updateBatch,
} from "../controller/superadminController.js";

const superAdminRouter = express.Router();

superAdminRouter.post("/login", superAdminLogin);
superAdminRouter.post("/approveUserAndChangeRole",authenticateAdminOrSuperAdmin,approveUserAndChangeRole);
superAdminRouter.post("/createBatchBySuperAdmin",authenticateAdminOrSuperAdmin,createBatchBySuperAdmin);
superAdminRouter.post("/createCourseBySuperAdmin",authenticateAdminOrSuperAdmin,createCourseBySuperAdmin);
superAdminRouter.post("/createModuleBySuperAdmin",authenticateAdminOrSuperAdmin,createModuleBySuperAdmin);
superAdminRouter.post("/createLessonBySuperAdmin",authenticateAdminOrSuperAdmin,createLessonBySuperAdmin);
superAdminRouter.post("/assignToBatch",authenticateAdminOrSuperAdmin,assignToBatch);
superAdminRouter.post("/bulkUploadBySuperAdmin", upload.single("excelFile"), multerErrorHandler, authenticateAdminOrSuperAdmin, bulkUploadBySuperAdmin);
superAdminRouter.post("/uploadPdfUnderLesson",upload.single("file"),authenticateAdminOrSuperAdmin,uploadPdfUnderLesson);
superAdminRouter.post("/assignAssignment",authenticateAdminOrSuperAdmin,assignAssignment);
superAdminRouter.post("/provideFeedback/feedback/:submission_id",authenticateAdminOrSuperAdmin,provideFeedback);
superAdminRouter.post("/lessons/approveLessonUpdate",authenticateAdminOrSuperAdmin,approveLessonUpdate);
superAdminRouter.post("/postLiveClassLink",authenticateAdminOrSuperAdmin,postLiveClassLink);
superAdminRouter.post("/createQuiz",authenticateAdminOrSuperAdmin,createQuiz);
superAdminRouter.post("/createQuestion",authenticateAdminOrSuperAdmin,createQuestion);
 

superAdminRouter.get("/viewallusers",authenticateAdminOrSuperAdmin, viewallusers);
superAdminRouter.get("/courses", authenticateAdminOrSuperAdmin, getAllCourses);
superAdminRouter.get("/courses/:course_id/getModulesByCourse", authenticateAdminOrSuperAdmin, getModulesByCourse);
superAdminRouter.get("/courses/:course_id/modules/:module_id/getLessonsByModuleAndCourse", authenticateAdminOrSuperAdmin, getLessonsByModuleAndCourse);
superAdminRouter.get("/viewSubmittedAssignments/submissions/:batch_id/:lesson_id",authenticateAdminOrSuperAdmin,viewSubmittedAssignments);
superAdminRouter.get("/:quiz_id/getQuestionsByQuiz",authenticateAdminOrSuperAdmin,getQuestionsByQuiz);
superAdminRouter.get("/getStudentMarksByBatch/batch/:batch_id/quiz/:quiz_id",authenticateAdminOrSuperAdmin,getStudentMarksByBatch);


superAdminRouter.put("/courses/:course_id", authenticateAdminOrSuperAdmin, updateCourse);
superAdminRouter.put("/modules/:module_id", authenticateAdminOrSuperAdmin, updateModule);
superAdminRouter.put("/lessons/:lesson_id", authenticateAdminOrSuperAdmin, updateLesson);
superAdminRouter.put("/updateQuestion/:quiz_id/question/:question_id",authenticateAdminOrSuperAdmin,updateQuestion);
superAdminRouter.put("/updateBatch/:batchId",authenticateAdminOrSuperAdmin,updateBatch);


superAdminRouter.delete("/deleteQuestion/:quiz_id/question/:question_id",authenticateAdminOrSuperAdmin,deleteQuestion);
superAdminRouter.delete("/deleteUser/:userId",authenticateAdminOrSuperAdmin,deleteUser);
superAdminRouter.delete("/courses/:course_id", authenticateAdminOrSuperAdmin, deleteCourse);
superAdminRouter.delete("/courses/:course_id/modules/:module_id", authenticateAdminOrSuperAdmin, deleteModule);
superAdminRouter.delete("/courses/:course_id/modules/:module_id/lessons/:lesson_id", authenticateAdminOrSuperAdmin, deleteLesson);
superAdminRouter.delete("/removeStudentFromCourse/:studentId/:batchId",authenticateAdminOrSuperAdmin,removeStudentFromCourse);
superAdminRouter.delete("/removeTeacherFromCourse/:teacherId/:batchId",authenticateAdminOrSuperAdmin,removeTeacherFromCourse);
superAdminRouter.delete("/deleteAssignment/:assignmentId",authenticateAdminOrSuperAdmin,deleteAssignment);
superAdminRouter.delete("/deleteBatch/:batchId",authenticateAdminOrSuperAdmin,deleteBatch);

export default superAdminRouter;
export const defineAssociations = (sequelize) => {
    const { User, Batch, StudentBatchAssignment, Course, Module, Lesson, TeacherBatchAssignment,Feedback } = sequelize.models;

    // User and StudentBatch association
    User.hasMany(StudentBatchAssignment, { foreignKey: "student_id", as: "studentBatches" });
    StudentBatchAssignment.belongsTo(User, { foreignKey: "student_id", as: "student" });

    // Batch and StudentBatch association
    Batch.hasMany(StudentBatchAssignment, { foreignKey: "batch_id", as: "studentBatchAssignments" });
    StudentBatchAssignment.belongsTo(Batch, { foreignKey: "batch_id", as: "batch" });

    // Course and Batch association
    Course.hasMany(Batch, { foreignKey: "course_id", as: "batches" });
    Batch.belongsTo(Course, { foreignKey: "course_id", as: "course" });

    // TeacherBatchAssignment and Batch association
    Batch.hasMany(TeacherBatchAssignment, { foreignKey: "batch_id", as: "teacherBatchAssignments" });
    TeacherBatchAssignment.belongsTo(Batch, { foreignKey: "batch_id", as: "batch" });

    // TeacherBatchAssignment and User association (Teacher)
    User.hasMany(TeacherBatchAssignment, { foreignKey: "teacher_id", as: "teacherAssignments" });
    TeacherBatchAssignment.belongsTo(User, { foreignKey: "teacher_id", as: "teacher" });

    // Course and Module association
    Course.hasMany(Module, { foreignKey: "course_id", as: "modules" });
    Module.belongsTo(Course, { foreignKey: "course_id", as: "course" });

    // Module and Lesson association
    Module.hasMany(Lesson, { foreignKey: "module_id", as: "lessons" });
    Lesson.belongsTo(Module, { foreignKey: "module_id", as: "module" });

    Lesson.hasMany(Feedback, { foreignKey: "lesson_id", as: "feedbacks" });
    Feedback.belongsTo(Lesson, { foreignKey: "lesson_id", as: "lesson" });

    User.hasMany(Feedback, { foreignKey: "student_id", as: "studentFeedbacks" });
    Feedback.belongsTo(User, { foreignKey: "student_id", as: "student" });

};

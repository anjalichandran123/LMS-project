import { DataTypes } from "sequelize";

export const createStudentProgressModel = (sequelize) => {
    const StudentProgress = sequelize.define("StudentProgress", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        student_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "Users", // Reference to the Users table
                key: "id",
            },
        },
        is_project_completed: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        is_quiz_completed: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        is_exam_completed: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    });

    // Associations
    StudentProgress.associate = (models) => {
        StudentProgress.belongsTo(models.UserModel, {
            foreignKey: "student_id",
            as: "student", // Alias for student
        });
    };

    return StudentProgress;
};

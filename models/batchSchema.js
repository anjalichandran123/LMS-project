import { DataTypes } from "sequelize";

export const createBatchModel = (sequelize) => {
    const Batch = sequelize.define("Batch", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: { 
            type: DataTypes.STRING,
            allowNull: false,
        },
        course_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "Courses", // Referencing Courses table
                key: "id",
            },
        },
        start_date: {
            type: DataTypes.DATE,
            allowNull: true,
            validate: {
                isDate: true, // Ensures it's a valid date
            },
        },
        end_date: {
            type: DataTypes.DATE,
            allowNull: true,
            validate: {
                isDate: true, // Ensures it's a valid date
            },
        },
    });

    // Define Associations
    Batch.associate = (models) => {
        // Association with Course
        Batch.belongsTo(models.Course, {
            foreignKey: "course_id",
            as: "course", // Alias for course reference
        });

        // Association with TeacherBatchAssignment
        Batch.hasMany(models.TeacherBatchAssignment, {
            foreignKey: "batch_id",
            as: "teacherBatchAssignments", // Alias for teacher batch assignments
        });

        // Association with StudentBatchAssignment (Link to students)
        Batch.hasMany(models.StudentBatchAssignment, {
            foreignKey: "batch_id",
            as: "studentBatchAssignments", // Alias for student batch assignments
        });
    };

    return Batch;
};

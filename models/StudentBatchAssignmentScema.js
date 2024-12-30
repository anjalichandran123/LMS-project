import { DataTypes } from "sequelize";

export const createStudentBatchAssignmentModel = (sequelize) => {
    const StudentBatchAssignment = sequelize.define("StudentBatchAssignment", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        student_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "Users", // Referencing Users table (students)
                key: "id",
            },
        },
        batch_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "Batches", // Referencing Batches table
                key: "id",
            },
        },
    });

    // Associations
    StudentBatchAssignment.associate = (models) => {
        StudentBatchAssignment.belongsTo(models.User, {
            foreignKey: "student_id",
            as: "student", // Alias for student reference
        });

        StudentBatchAssignment.belongsTo(models.Batch, {
            foreignKey: "batch_id",
            as: "batch", // Alias for batch reference
        });
    };

    return StudentBatchAssignment;
};

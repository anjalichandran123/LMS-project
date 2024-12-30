import { DataTypes } from "sequelize";

export const createTeacherBatchAssignmentModel = (sequelize) => {
    const TeacherBatchAssignment = sequelize.define("TeacherBatchAssignment", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        teacher_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "Users", // Referencing Users table for teachers
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
        assigned_by: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "Users", // Referencing Users table for assigned_by
                key: "id",
            },
        },
    });

    // Associations
    TeacherBatchAssignment.associate = (models) => {
        TeacherBatchAssignment.belongsTo(models.User, {
            foreignKey: "teacher_id",
            as: "teacher", // Alias for the teacher reference
        });

        TeacherBatchAssignment.belongsTo(models.Batch, {
            foreignKey: "batch_id",
            as: "batch", // Alias for the batch reference
        });

        TeacherBatchAssignment.belongsTo(models.User, {
            foreignKey: "assigned_by",
            as: "assignedBy", // Alias for the assignedBy reference
        });
    };

    return TeacherBatchAssignment;
};

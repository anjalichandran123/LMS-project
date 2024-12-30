import { DataTypes } from "sequelize";

export const createSubmissionModel = (sequelize) => {
    return sequelize.define("Submission", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        assignment_id: {
            type: DataTypes.INTEGER,
            allowNull: false, // Assignment ID must be present
        },
        student_id: {
            type: DataTypes.INTEGER,
            allowNull: true, // Ensure student ID is always stored
        },
        batch_id: {
            type: DataTypes.INTEGER,
            allowNull: true, // Batch ID for grouping submissions by batches
        },
        contentUrl: {
            type: DataTypes.STRING, // Path to the submitted file or content
            allowNull: true,
        },
        submittedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW, // Default timestamp for when the submission was made
        },
        feedback: {
            type: DataTypes.TEXT, // Optional feedback for the submission
            allowNull: true,
        },
        status: {
            type: DataTypes.STRING, // Status: 'on time' or 'late'
            allowNull: true,
        },
    });
};

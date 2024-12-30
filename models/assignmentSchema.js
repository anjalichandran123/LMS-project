import { DataTypes } from "sequelize";

export const createAssignmentModel = (sequelize) => {
    return sequelize.define("Assignment", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        course_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        module_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        lesson_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        batch_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        contentType: {
            type: DataTypes.ENUM("pdf", "typed"),
            allowNull: false,
        },
        contentUrl: {
            type: DataTypes.STRING, // For PDFs or typed content
            allowNull: true,
        },
        submissionLink: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        dueDate: {
            type: DataTypes.DATE, // The due date for the assignment
            allowNull: true,
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    });
};

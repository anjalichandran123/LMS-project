import { DataTypes } from "sequelize";

export const createLessonModel = (sequelize) => {
    if (!sequelize || typeof sequelize.define !== "function") {
        throw new Error("Sequelize instance is not defined or invalid");
    }

    return sequelize.define("Lesson", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        course_id: {
            type: DataTypes.INTEGER,
            allowNull: true, // Ensure course_id is required
            references: {
                model: "Courses", // Assuming the table for courses is named 'Courses'
                key: "id",
            },
            onDelete: "CASCADE", // Cascade deletion when the associated course is deleted
        },
        module_id: {
            type: DataTypes.INTEGER,
            allowNull: false, // module_id is required
            references: {
                model: "Modules", // Assuming the table for modules is named 'Modules'
                key: "id",
            },
            onDelete: "CASCADE", // Cascade deletion when the associated module is deleted
        },
        
        contentUrl: {
            type: DataTypes.STRING,
            allowNull: true, // Content URL can be null initially
            validate: {
                notEmpty: true, // Ensure it's a valid URL if provided
            },
        },
        contentType: {
            type: DataTypes.ENUM("pdf", "url", "audio"),
            allowNull: true, // Content type can be null initially
            validate: {
                isIn: [["pdf", "url", "audio"]], // Only these types are allowed
            },
        },
        isApproved: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false, // Default to not approved
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    });
};

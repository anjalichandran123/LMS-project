import { DataTypes } from "sequelize";

export const createCourseModel = (sequelize) => {
    if (!sequelize || typeof sequelize.define !== "function") {
        throw new Error("Sequelize instance is not defined or invalid");
    }

    return sequelize.define("Course", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        startDate: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        endDate: {
            type: DataTypes.DATE,
            allowNull: false,
            validate: {
                isAfterStart(value) {
                    if (this.startDate && value <= this.startDate) {
                        throw new Error("End date must be after the start date");
                    }
                },
            },
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

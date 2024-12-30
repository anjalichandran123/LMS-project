// models/feedbackModel.js
import { DataTypes } from "sequelize";

const createFeedbackModel = (sequelize) => {
  return sequelize.define("Feedback", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    lesson_id: {
      type: DataTypes.INTEGER, // Foreign key for the lesson
      allowNull: false,
    },
    student_id: {
      type: DataTypes.INTEGER, // Foreign key for the student
      allowNull: false,
    },
    feedback_text: {
      type: DataTypes.TEXT, // Feedback content
      allowNull: false,
    },
    rating: {
      type: DataTypes.INTEGER, // Optional rating (e.g., out of 5)
      allowNull: true,
      validate: {
        min: 1,
        max: 5,
      },
    },
  });
};

export default createFeedbackModel;

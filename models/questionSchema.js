import { DataTypes } from "sequelize";

export const createQuestionModel = (sequelize) => {
  return sequelize.define("Question", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    quiz_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    question_text: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    option_1: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    option_2: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    option_3: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    option_4: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    correct_option: {
      type: DataTypes.INTEGER,  // 1, 2, 3, or 4
      allowNull: false,
    },
    marks: {
      type: DataTypes.INTEGER,
      defaultValue: 1, // Each question has 1 mark
    },
  });
};

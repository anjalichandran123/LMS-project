import { DataTypes } from "sequelize";

export const createQuizModel = (sequelize) => {
  const Quizzes = sequelize.define("Quizzes", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Courses', // Ensure 'Courses' table exists
        key: 'id',
      },
    },
    module_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Modules', // Ensure 'Modules' table exists
        key: 'id',
      },
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  });

  // Optional: If you want to specify the table name explicitly
  // Quizzes.tableName = "Quizzes"; // Not necessary unless you want to enforce table name

  return Quizzes;
};

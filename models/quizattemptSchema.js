import { DataTypes } from "sequelize";

export const createStudentAnswerModel = (sequelize) => {
  const StudentAnswer = sequelize.define("StudentAnswer", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    student_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    question_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    selected_option: {
      type: DataTypes.INTEGER,  // 1, 2, 3, or 4
      allowNull: false,
    },
    is_correct: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    marks_obtained: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  });

  // Assuming you have defined 'User' and 'Question' models
  StudentAnswer.associate = (models) => {
    // Connecting StudentAnswer to the User model (student)
    StudentAnswer.belongsTo(models.User, {
      foreignKey: 'student_id',
      as: 'student',
      onDelete: 'CASCADE', // You can adjust the behavior based on your requirements
    });

    // Connecting StudentAnswer to the Question model
    StudentAnswer.belongsTo(models.Question, {
      foreignKey: 'question_id',
      as: 'question',
      onDelete: 'CASCADE', // You can adjust the behavior based on your requirements
    });
  };

  return StudentAnswer;
};

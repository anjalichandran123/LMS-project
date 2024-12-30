import { DataTypes } from 'sequelize';

export const createLessonCompletionModel = (sequelize) => {
  const LessonCompletion = sequelize.define('LessonCompletion', {
    student_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: false,  // Assumes that the course must be associated with the lesson
    },
    module_id: {
      type: DataTypes.INTEGER,
      allowNull: false,  // Assumes that the module must be associated with the lesson
    },
    lesson_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    is_completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    completion_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  return LessonCompletion;
};

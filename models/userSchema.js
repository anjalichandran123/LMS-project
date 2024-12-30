// models/userModel.js
import { DataTypes } from "sequelize";

export const createUserModel = (sequelize) => {
  const User = sequelize.define("User", {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("superadmin", "admin", "student", "teacher"),
      allowNull: false,
      defaultValue: "student",
    },
    isApproved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    batch_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Batches', // Ensure 'Batches' table exists
        key: 'id',
      },
    },
    resetToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    resetTokenExpiration: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  // Define Associations
  User.associate = (models) => {
    // Association with StudentBatchAssignment
    User.hasMany(models.StudentBatchAssignment, {
      foreignKey: "student_id",
      as: "studentBatches", // Alias for student batches
    });

    // Additional associations for teacher
    User.hasMany(models.TeacherBatchAssignment, {
      foreignKey: "teacher_id",
      as: "teacherAssignments", // Alias for teacher assignments
    });
  };

  return User;
};

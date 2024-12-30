import { DataTypes } from "sequelize";

export const createLiveClassLinkModel = (sequelize) => {
  const LiveClassLink = sequelize.define("LiveClassLink", {
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
    batch_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Batches', // Ensure 'Batches' table exists
        key: 'id',
      },
    },
    link: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    scheduled_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  });

  return LiveClassLink;
};

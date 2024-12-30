module.exports = {
    up: async (queryInterface, Sequelize) => {
      await queryInterface.createTable('Quizzes', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        course_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        module_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        lesson_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        title: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        description: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
      });
    },
  
    down: async (queryInterface, Sequelize) => {
      await queryInterface.dropTable('Quizzes');
    }
  };
  
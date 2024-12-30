import { Sequelize } from "sequelize";

const sequelize = new Sequelize("LMS", "postgres", "1234", {
    host: "localhost",
    dialect: "postgres", // Change to the dialect you're using
});

export default sequelize;

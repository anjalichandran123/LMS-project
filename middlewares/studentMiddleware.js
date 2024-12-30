import jwt from "jsonwebtoken";

export const authenticateStudent = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Access token is missing" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if the user is a student
        if (decoded.role !== "student") {
            return res.status(403).json({ message: "Forbidden: Student access required" });
        }

        req.user = decoded; // Attach the decoded user info to the request object
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

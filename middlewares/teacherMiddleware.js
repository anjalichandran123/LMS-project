import jwt from "jsonwebtoken";

export const authenticateTeacher = (req, res, next) => {
    // Extract the token from the Authorization header
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Access token is missing" });
    }

    try {
        // Verify the token using the secret
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if the user has the teacher role
        if (decoded.role !== "teacher") {
            return res.status(403).json({ message: "Forbidden: Teacher access required" });
        }

        // Attach the decoded user info to the request object
        req.user = decoded;
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        console.error("Token verification failed:", error);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

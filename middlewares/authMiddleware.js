import jwt from 'jsonwebtoken';

export const authenticateAdminOrSuperAdmin = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Access token is missing" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Log the decoded token to check the role
        console.log("Decoded Token:", decoded);

        if (decoded.role !== "admin" && decoded.role !== "superadmin") {
            return res.status(403).json({ message: "Forbidden: Admin or Superadmin access required" });
        }

        req.user = decoded;  // Attach decoded user data to the request object
        next();  // Proceed to the next middleware or route handler
    } catch (error) {
        console.error("Token verification error:", error);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

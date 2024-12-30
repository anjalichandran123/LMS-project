import bcrypt from "bcrypt";
import { UserModel } from "../postgres/postgres.js";
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';


// User Registration
export const registerUser = async (req, res) => {
    const { name, email, password,role} = req.body;

    try {
        // Check if the user already exists
        const existingUser = await UserModel.findOne({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ message: "User already registered" }); // 409 for conflict
        }

        // Hash the password before saving the user
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        await UserModel.create({ name, email, password: hashedPassword,role });
        return res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error("Error during registration:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};


export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find the user by email
        const user = await UserModel.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if the user is approved by the superadmin
        if (!user.isApproved) {
            return res.status(403).json({ message: "Your account has not been approved by the superadmin." });
        }

        // Check if the password matches
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid password" });
        }

        // Generate a token (e.g., JWT) for the user
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Return a detailed response
        return res.status(200).json({
            message: "Login successful",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            token,
        });
    } catch (error) {
        console.error("Error during login:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};



export const logoutUser = (req, res) => {
    try {
        // For stateless JWT-based authentication, you can "logout" by informing the client to remove the token
        return res.status(200).json({ message: "Logout successful" });
    } catch (error) {
        console.error("Error during logout:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};




export const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        // Find the user by email
        const user = await UserModel.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Generate a reset token and expiration time
        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetTokenExpiration = new Date(Date.now() + 3600000); // Token valid for 1 hour

        // Store the reset token and expiration in the database
        user.resetToken = resetToken;
        user.resetTokenExpiration = resetTokenExpiration;
        await user.save();

        // Set up Gmail SMTP transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',  // Use Gmail SMTP service
            auth: {
                user: process.env.EMAIL_USER,  // Your email address (e.g., 'example@gmail.com')
                pass: process.env.EMAIL_PASS,  // Your email password or App Password
            },
        });

        // Generate the password reset link
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

        // Send the reset email
        await transporter.sendMail({
            to: user.email,
            subject: "Password Reset Request",
            html: `<p>You requested a password reset. Click <a href="${resetLink}">here</a> to reset your password. This link is valid for 1 hour.</p>`,
        });

        return res.status(200).json({ message: "Password reset email sent" });
    } catch (error) {
        console.error("Error during forgot password:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};



export const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body; // Get the token and new password from the request body

    try {
        // Find the user by the reset token
        const user = await UserModel.findOne({ where: { resetToken: token } });

        if (!user) {
            return res.status(404).json({ message: "Invalid or expired reset token" });
        }

        // Check if the token has expired
        if (new Date() > new Date(user.resetTokenExpiration)) {
            return res.status(400).json({ message: "Reset token has expired" });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password
        user.password = hashedPassword;
        user.resetToken = null; // Clear the reset token after successful reset
        user.resetTokenExpiration = null; // Clear the expiration time
        await user.save();

        return res.status(200).json({ message: "Password has been successfully reset" });
    } catch (error) {
        console.error("Error during reset password:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
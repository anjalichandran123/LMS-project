// controllers/classController.js
import {Liveclass} from "../postgres/postgres.js"
import {Notification} from "../postgres/postgres.js"; // Import notification model
import {UserModel} from "../postgres/postgres.js"; // Import user model

export const postLiveClassLink = async (req, res) => {
  const { course_id, batch_id, link, scheduled_time } = req.body;
  const teacher_id = req.user.id; // Assuming the teacher's ID is available in the request
  const userRole = req.user.role; // Get the user's role from the request

  // Check if the user is an admin, superadmin, or teacher
  if (!['admin', 'superadmin', 'teacher'].includes(userRole)) {
    return res.status(403).json({ message: "Access denied. Only admins, superadmins, or teachers can post live class links." });
  }

  try {
    // Create the live class link
    const liveClass = await Liveclass.create({
      course_id,
      batch_id,
      link,
      scheduled_time: new Date(scheduled_time), // Convert to Date object
    });

    // Schedule a notification for students 10 minutes before the class starts
    const notificationTime = new Date(new Date(scheduled_time).getTime() - 10 * 60000); // 10 minutes before the class

    // Get the students for the given course and batch
    const students = await UserModel.findAll({
      where: {
        role: 'student', // Assuming "student" role exists
        batch_id: batch_id,
      },
    });

    // Send notifications to students
    const notifications = students.map((student) => ({
      user_id: student.id,
      message: `Live class begins in 10 minutes. Click here to join: ${link}`,
      notification_time: notificationTime,
    }));

    // Create notifications for all students
    await Notification.bulkCreate(notifications);

    return res.status(201).json({
      message: "Live class link posted and notifications scheduled successfully.",
      liveClass,
    });
  } catch (error) {
    console.error("Error posting live class link:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};



// controllers/studentController.js

export const getLiveClassLinkAndNotifications = async (req, res) => {
  const student_id = req.user.id; // Assuming student ID is available in request
  const { course_id, batch_id } = req.params; // Extract course_id and batch_id from URL parameters

  try {
    // Get the live class links for the student based on course_id and batch_id
    const liveClasses = await Liveclass.findAll({
      where: {
        course_id: course_id, // Get by course_id
        batch_id: batch_id, // Get by batch_id
      },
    });

    if (!liveClasses || liveClasses.length === 0) {
      return res.status(404).json({ message: "No live classes found for this course and batch." });
    }

    // Get unread notifications for the student
    const notifications = await Notification.findAll({
      where: {
        user_id: student_id, // Get notifications for the student
        seen: false, // Unread notifications
      },
    });

    // Mark notifications as seen once viewed by the student
    await Notification.update({ seen: true }, { where: { user_id: student_id } });

    return res.status(200).json({
      message: "Live class links and notifications retrieved successfully.",
      liveClasses,
      notifications,
    });
  } catch (error) {
    console.error("Error retrieving live class link or notifications:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};


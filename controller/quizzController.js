import { createQuestionModel } from "../models/questionSchema.js";
import {createQuizModel} from "../models/quizSchema.js"
import { AnswerModel, LessonCompletion } from "../postgres/postgres.js";
import { QuizModel } from "../postgres/postgres.js";
import { QuestionModel } from "../postgres/postgres.js";


// Controller for creating a lesson completion
export const createLessonCompletion = async (req, res) => {
  const { student_id, course_id, module_id, lesson_id, is_completed, completion_date } = req.body;

  try {
    // Create the LessonCompletion entry
    const lessonCompletion = await LessonCompletion.create({
      student_id,
      course_id,
      module_id,
      lesson_id,
      is_completed,
      completion_date,
    });

    return res.status(201).json({
      message: "Lesson completion created successfully.",
      lessonCompletion,
    });
  } catch (error) {
    console.error("Error creating lesson completion:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};


// Create a quiz under a module for a course
export const createQuiz = async (req, res) => {
  const { course_id, module_id, title, description } = req.body;

  try {
      // Validate input
      if (!course_id || !module_id || !title) {
          return res.status(400).json({ message: "Course ID, Module ID, and Title are required" });
      }

      // Ensure only authorized roles can create quizzes
      const allowedRoles = ["admin", "superadmin", "teacher"];
      if (!allowedRoles.includes(req.user.role)) {
          return res.status(403).json({ message: "Forbidden: You are not authorized to create quizzes" });
      }

      // Check if the course exists
      const course = await CourseModel.findOne({ where: { id: course_id } });
      if (!course) {
          return res.status(404).json({ message: "Course not found" });
      }

      // Check if the module exists under the course
      const module = await ModuleModel.findOne({ where: { id: module_id, course_id } });
      if (!module) {
          return res.status(404).json({ message: "Module not found under the specified course" });
      }

      // Create the quiz
      const quiz = await QuizModel.create({
          course_id,
          module_id,
          title,
          description,
          created_by: req.user.id, // Optionally track who created the quiz
      });

      return res.status(201).json({
          message: "Quiz created successfully.",
          quiz,
      });
  } catch (error) {
      console.error("Error creating quiz:", error);
      return res.status(500).json({ message: "Internal server error." });
  }
};



// Create a question for a quiz
export const createQuestion = async (req, res) => {
    const { quiz_id, question_text, option_1, option_2, option_3, option_4, correct_option } = req.body;
  
    // Assuming the user's role is set in req.user (after authentication)
    const userRole = req.user.role; // 'admin', 'superadmin', or 'teacher'
  
    // Check if the user has the required role
    if (!['admin', 'superadmin', 'teacher'].includes(userRole)) {
      return res.status(403).json({
        message: "Access denied. You do not have permission to create a question."
      });
    }
  
    const sequelize = req.app.get("sequelize");
    const Question = createQuestionModel(sequelize);
  
    try {
      const question = await Question.create({
        quiz_id,
        question_text,
        option_1,
        option_2,
        option_3,
        option_4,
        correct_option,
      });
  
      return res.status(200).json({
        message: "Question created successfully.",
        question,
      });
    } catch (error) {
      console.error("Error creating question:", error);
      return res.status(500).json({ message: "Internal server error." });
    }
  };


  
// Get the quiz for a specific module in a course
export const getQuizForModule = async (req, res) => {
  const { course_id, module_id, student_id } = req.params; // Get course_id, module_id, and student_id from params

  try {
      // 1. Validate inputs
      if (!course_id || !module_id || !student_id) {
          return res.status(400).json({ message: "Course ID, Module ID, and Student ID are required" });
      }

      // 2. Check if the student exists
      const student = await UserModel.findOne({ where: { id: student_id, role: "student" } });
      if (!student) {
          return res.status(404).json({ message: "Student not found" });
      }

      // 3. Check if the module exists under the course
      const module = await ModuleModel.findOne({ where: { id: module_id, course_id } });
      if (!module) {
          return res.status(404).json({ message: "Module not found under the specified course" });
      }

      // 4. Check if the student has completed all quizzes or assignments required to unlock this module
      const previousQuizzes = await QuizModel.findAll({
          where: {
              course_id,
              module_id,
          },
          include: [
              {
                  model: QuizCompletion,
                  as: "quizCompletions",
                  where: {
                      student_id,
                      is_completed: true, // Assuming this field tracks completion
                  },
                  required: false,
              },
          ],
      });

      const allQuizzesCompleted = previousQuizzes.every(
          (quiz) => quiz.quizCompletions && quiz.quizCompletions.length > 0
      );

      if (!allQuizzesCompleted) {
          return res.status(403).json({ message: "Complete previous quizzes or assignments to access this module's quiz." });
      }

      // 5. Retrieve the quiz for the module
      const quiz = await QuizModel.findOne({
          where: {
              course_id,
              module_id,
          },
      });

      if (!quiz) {
          return res.status(404).json({ message: "No quiz found for this module." });
      }

      // 6. Return the quiz data
      return res.status(200).json({
          message: "Quiz found successfully.",
          quiz,
      });
  } catch (error) {
      console.error("Error retrieving quiz:", error);
      return res.status(500).json({ message: "Internal server error." });
  }
};


// Controller function to get questions under a specific quiz
export const getQuestionsForQuiz = async (req, res) => {
    const { course_id, module_id, quiz_id, student_id } = req.params; // Get parameters from the URL

    try {
        // 1. Validate inputs
        if (!course_id || !module_id || !quiz_id || !student_id) {
            return res.status(400).json({ message: "Course ID, Module ID, Quiz ID, and Student ID are required" });
        }

        // 2. Check if the student exists
        const student = await UserModel.findOne({ where: { id: student_id, role: "student" } });
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        // 3. Check if the module exists under the course
        const module = await ModuleModel.findOne({ where: { id: module_id, course_id } });
        if (!module) {
            return res.status(404).json({ message: "Module not found under the specified course" });
        }

        // 4. Check if the quiz exists under the module and course
        const quiz = await QuizModel.findOne({
            where: {
                id: quiz_id,
                course_id: course_id,
                module_id: module_id,
            },
        });

        if (!quiz) {
            // If no quiz is found, return an error
            return res.status(404).json({ message: "Quiz not found for the specified module and course" });
        }

        // 5. Fetch questions related to this quiz
        const questions = await QuestionModel.findAll({
            where: { quiz_id: quiz_id },
            attributes: ["id", "question_text", "option_1", "option_2", "option_3", "option_4", "createdAt"], // Exclude correct_option
        });

        if (questions.length === 0) {
            // If no questions are found for the quiz, return an error
            return res.status(404).json({ message: "No questions found for this quiz" });
        }

        // 6. Return the questions
        return res.status(200).json({
            message: "Questions found successfully.",
            questions,
        });
    } catch (error) {
        console.error("Error retrieving questions:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

  //submit the answer 

  export const submitStudentAnswer = async (req, res) => {
    const { student_id, question_id, selected_option } = req.body; // Get the answer data from the request body
  
    try {
      // 1. Fetch the correct option for the given question
      const question = await QuestionModel.findOne({
        where: {
          id: question_id,
        },
      });
  
      if (!question) {
        // If the question doesn't exist
        return res.status(404).json({
          message: 'Question not found.',
        });
      }
  
      // 2. Check if the selected option is correct
      const is_correct = selected_option === question.correct_option; // Assuming `correct_option` is the field in Question model
  
      // 3. Create a new StudentAnswer record to store the submitted answer
      const studentAnswer = await AnswerModel.create({
        student_id: student_id,
        question_id: question_id,
        selected_option: selected_option,
        is_correct: is_correct,
        marks_obtained: is_correct ? 1 : 0, // Assuming 1 mark for correct answer
      });
  
      // 4. Return the result
      return res.status(200).json({
        message: is_correct ? 'Correct answer!' : 'Incorrect answer.',
        studentAnswer,
      });
    } catch (error) {
      console.error('Error submitting answer:', error);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  };
  



  export const getTotalMarksForQuiz = async (req, res) => {
    const { student_id, quiz_id } = req.params; // Get the student_id and quiz_id from the URL parameters
  
    try {
      // 1. Fetch all the questions related to the given quiz_id
      const questions = await QuestionModel.findAll({
        where: {
          quiz_id: quiz_id,
        },
      });
  
      if (questions.length === 0) {
        // If no questions are found for the quiz
        return res.status(404).json({
          message: 'No questions found for this quiz.',
        });
      }
  
      // 2. Fetch the student's answers for the given quiz_id
      const studentAnswers = await AnswerModel.findAll({
        where: {
          student_id: student_id,
          question_id: questions.map((question) => question.id), // Get answers for the questions related to the quiz
        },
      });
  
      if (studentAnswers.length === 0) {
        // If no answers are found for the student
        return res.status(404).json({
          message: 'No answers found for this student under this quiz.',
        });
      }
  
      // 3. Calculate the total marks (sum of marks_obtained)
      const totalMarks = studentAnswers.reduce((total, answer) => total + answer.marks_obtained, 0);
  
      // 4. Return the total marks
      return res.status(200).json({
        message: 'Total marks retrieved successfully.',
        totalMarks: totalMarks,
      });
    } catch (error) {
      console.error('Error retrieving total marks:', error);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  };
  

//get  all questions under the quiz id
  export const getQuestionsByQuiz = async (req, res) => {
    const { quiz_id } = req.params;

    const sequelize = req.app.get("sequelize");
    const Question = createQuestionModel(sequelize);

    try {
        const questions = await Question.findAll({ where: { quiz_id } });
        if (!questions.length) {
            return res.status(404).json({ message: "No questions found for this quiz." });
        }

        return res.status(200).json({
            message: "Questions retrieved successfully.",
            questions,
        });
    } catch (error) {
        console.error("Error retrieving questions:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};


//delete quistion under the quiz

export const deleteQuestion = async (req, res) => {
  const { quiz_id, question_id } = req.params;

  // Check user role
  const userRole = req.user.role; // 'admin', 'superadmin', or 'teacher'
  if (!['admin', 'superadmin', 'teacher'].includes(userRole)) {
      return res.status(403).json({
          message: "Access denied. You do not have permission to delete a question."
      });
  }

  const sequelize = req.app.get("sequelize");
  const Question = createQuestionModel(sequelize);

  try {
      const question = await Question.findOne({ where: { id: question_id, quiz_id } });
      if (!question) {
          return res.status(404).json({ message: "Question not found." });
      }

      await question.destroy();

      return res.status(200).json({
          message: "Question deleted successfully.",
      });
  } catch (error) {
      console.error("Error deleting question:", error);
      return res.status(500).json({ message: "Internal server error." });
  }
};


//update the lesson under the quiz

export const updateQuestion = async (req, res) => {
  const { quiz_id, question_id } = req.params;
  const { question_text, option_1, option_2, option_3, option_4, correct_option } = req.body;

  // Check user role
  const userRole = req.user.role; // 'admin', 'superadmin', or 'teacher'
  if (!['admin', 'superadmin', 'teacher'].includes(userRole)) {
      return res.status(403).json({
          message: "Access denied. You do not have permission to update a question."
      });
  }

  const sequelize = req.app.get("sequelize");
  const Question = createQuestionModel(sequelize);

  try {
      const question = await Question.findOne({ where: { id: question_id, quiz_id } });
      if (!question) {
          return res.status(404).json({ message: "Question not found." });
      }

      // Update question details
      await question.update({
          question_text,
          option_1,
          option_2,
          option_3,
          option_4,
          correct_option,
      });

      return res.status(200).json({
          message: "Question updated successfully.",
          question,
      });
  } catch (error) {
      console.error("Error updating question:", error);
      return res.status(500).json({ message: "Internal server error." });
  }
};


// view marks of students under the batch.
export const getStudentMarksByBatch = async (req, res) => {
  const { batch_id, quiz_id } = req.params;
  const userRole = req.user.role;

  // Ensure the user has the required role
  if (!["admin", "superadmin", "teacher"].includes(userRole)) {
    return res.status(403).json({
      message: "Access denied. You do not have permission to view student marks.",
    });
  }

  const sequelize = req.app.get("sequelize");
  const { StudentBatchAssignment, User, Question, Answer } = sequelize.models;

  if (!StudentBatchAssignment || !User || !Question || !Answer) {
    return res.status(500).json({
      message: "Server error: Models are not properly initialized.",
    });
  }

  try {
    // Get all students in the batch
    const students = await StudentBatchAssignment.findAll({
      where: { batch_id },
      include: [
        {
          model: User,
          as: "student", // Ensure this matches the association name
          attributes: ["id", "name", "email"],
        },
      ],
    });

    if (!students || students.length === 0) {
      return res.status(404).json({
        message: "No students found in the specified batch.",
      });
    }

    // Get all questions for the quiz
    const questions = await Question.findAll({
      where: { quiz_id },
    });

    if (!questions || questions.length === 0) {
      return res.status(404).json({
        message: "No questions found for this quiz.",
      });
    }

    const questionIds = questions.map((q) => q.id);

    // Fetch answers and calculate marks
    const studentMarks = await Promise.all(
      students.map(async (student) => {
        const answers = await Answer.findAll({
          where: {
            student_id: student.student.id,
            question_id: questionIds,
          },
        });

        const totalMarks = answers.reduce(
          (total, answer) => total + (answer.marks_obtained || 0),
          0
        );

        return {
          student: {
            id: student.student.id,
            name: student.student.name,
            email: student.student.email,
          },
          totalMarks,
        };
      })
    );

    return res.status(200).json({
      message: "Student marks retrieved successfully.",
      data: studentMarks,
    });
  } catch (error) {
    console.error("Error retrieving student marks:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};





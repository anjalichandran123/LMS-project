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



// Create a quiz under a course, module, and lesson
export const createQuiz = async (req, res) => {
    const { course_id, module_id, lesson_id, title, description } = req.body;
    const sequelize = req.app.get("sequelize");
    const Quiz = createQuizModel(sequelize);
  
    try {
      const quiz = await Quiz.create({
        course_id,
        module_id,
        lesson_id,
        title,
        description,
      });
  
      return res.status(200).json({
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
  




  // Get the quiz for a specific lesson, course, and module
  export const getQuizForLesson = async (req, res) => {
    const { course_id, module_id, lesson_id, student_id } = req.params; // Get course_id, module_id, lesson_id, and student_id from params
  
    try {
      // 1. Check if the student has completed the lesson
      const lessonCompletion = await LessonCompletion.findOne({
        where: {
          student_id: student_id,
          lesson_id: lesson_id,
          is_completed: true, // Assuming is_completed tracks if the student has completed the lesson
        },
      });
  
      if (!lessonCompletion) {
        // If the student has not completed the lesson, return a message
        return res.status(403).json({
          message: 'You must complete the lesson before accessing the quiz.',
        });
      }
  
      // 2. Fetch the quiz related to the lesson (based on course_id, module_id, lesson_id)
      const quiz = await QuizModel.findOne({
        where: {
          course_id: course_id,
          module_id: module_id,
          lesson_id: lesson_id,
        },
      });
  
      if (!quiz) {
        // If no quiz is found for this lesson, return an error
        return res.status(404).json({
          message: 'No quiz found for this lesson.',
        });
      }
  
      // 3. Return the quiz data
      return res.status(200).json({
        message: 'Quiz found successfully.',
        quiz,
      });
    } catch (error) {
      console.error('Error retrieving quiz:', error);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  };
  

  // Controller function to get questions under a specific quiz
// Controller function to get questions under a specific quiz
export const getQuestionsForQuiz = async (req, res) => {
  const { course_id, module_id, lesson_id, quiz_id, student_id } = req.params; // Get parameters from the URL

  try {
    // 1. Check if the student has completed the lesson
    const lessonCompletion = await LessonCompletion.findOne({
      where: {
        student_id: student_id,
        lesson_id: lesson_id,
        is_completed: true, // Assuming is_completed tracks if the student has completed the lesson
      },
    });

    if (!lessonCompletion) {
      // If the student has not completed the lesson, return a message
      return res.status(403).json({
        message: "You must complete the lesson before accessing the quiz.",
      });
    }

    // 2. Fetch the quiz for the given course_id, module_id, lesson_id, and quiz_id
    const quiz = await QuizModel.findOne({
      where: {
        id: quiz_id,
        course_id: course_id,
        module_id: module_id,
        lesson_id: lesson_id,
      },
    });

    if (!quiz) {
      // If no quiz is found, return an error
      return res.status(404).json({
        message: "No quiz found for this lesson.",
      });
    }

    // 3. Fetch questions related to this quiz
    const questions = await QuestionModel.findAll({
      where: {
        quiz_id: quiz_id,
      },
      attributes: ["id", "question_text", "option_1", "option_2", "option_3", "option_4", "createdAt"], // Exclude correct_option
    });

    if (questions.length === 0) {
      // If no questions are found for the quiz, return an error
      return res.status(404).json({
        message: "No questions found for this quiz.",
      });
    }

    // 4. Return the questions
    return res.status(200).json({
      message: "Questions found successfully.",
      questions,
    });
  } catch (error) {
    console.error("Error retrieving questions:", error);
    return res.status(500).json({ message: "Internal server error." });
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

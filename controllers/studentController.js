const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const Student = require("./../models/studentModel");
const Subject = require("./../models/subjectModel");
const Assignment = require("./../models/assigment");
const Lecture = require("./../models/lectureModel");
const AssignmentSolution = require("../models/AssignmentSolutionModel");
/*
// Controller function to record a subject for a student
exports.recordSubject = catchAsync(async (req, res, next) => {
  try {
    // Extract the student's ID from the authentication token
    const studentId = req.user.id;

    // Extract the subject name from the request body
    const { subjectName } = req.body;

    // Check if the subject exists
    const subject = await Subject.findOne({ name: subjectName });
    if (!subject) {
      return next(new AppError("Subject not found", 404));
    }

    // Find the student
    const student = await Student.findById(studentId);
    if (!student) {
      return next(new AppError("Student not found", 404));
    }

    // Check if the student meets the prerequisites for the subject
    const meetsPrerequisites = await student.meetsPrerequisites(subject._id);
    if (!meetsPrerequisites) {
      return next(new AppError("Student does not meet prerequisites", 403));
    }

    // Check if the student has already recorded the subject
    const alreadyRecorded = student.subjects.some((subjectRecord) =>
      subjectRecord.subject.equals(subject._id)
    );
    if (alreadyRecorded) {
      return next(new AppError("Subject already recorded", 400));
    }

    // Record the subject for the student
    const subjectRecord = { subject: subject._id, passed: false };
    student.subjects.push(subjectRecord);
    await student.save();

    res.status(200).json({
      status: "success",
      data: {
        student,
      },
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
});*/
/*
exports.recordSubject = catchAsync(async (req, res, next) => {
  try {
    // Extract the student's ID from the authentication token
    const studentId = req.user.id;

    // Extract the subject name from the request body
    const { subjectName } = req.body;

    // Check if the subject exists
    const subject = await Subject.findOne({ name: subjectName });
    if (!subject) {
      return next(new AppError("Subject not found", 404));
    }

    // Find the student and populate their subjects
    const student = await Student.findById(studentId).populate(
      "subjects.subject"
    );
    if (!student) {
      return next(new AppError("Student not found", 404));
    }

    // Check if the student meets the prerequisites for the subject
    const meetsPrerequisites = await student.meetsPrerequisites(subject._id);
    if (!meetsPrerequisites) {
      return next(new AppError("Student does not meet prerequisites", 403));
    }

    // Check if the student has already recorded the subject
    const alreadyRecorded = student.subjects.some((subjectRecord) => {
      if (subjectRecord.subject) {
        return subjectRecord.subject.equals(subject._id);
      }
      return false;
    });
    if (alreadyRecorded) {
      return next(new AppError("Subject already recorded", 400));
    }

    // Check for scheduling conflicts
    const hasConflict = student.subjects.some((subjectRecord) => {
      if (subjectRecord.subject) {
        const existingSubject = subjectRecord.subject;
        return (
          existingSubject.day === subject.day &&
          existingSubject.time === subject.time
        );
      }
      return false;
    });

    if (hasConflict) {
      return next(
        new AppError(
          "Schedule conflict: Another subject is already recorded at the same time on the same day",
          400
        )
      );
    }

    // Record the subject for the student
    const subjectRecord = { subject: subject._id, passed: false };
    student.subjects.push(subjectRecord);
    await student.save();

    res.status(200).json({
      status: "success",
      data: {
        student,
      },
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
});*/
exports.recordSubject = catchAsync(async (req, res, next) => {
  try {
    // Extract the student's ID from the authentication token
    const studentId = req.user.id;

    // Extract the subject name from the request body
    const { subjectName } = req.body;

    // Check if the subject exists
    const subject = await Subject.findOne({ name: subjectName });
    if (!subject) {
      return next(new AppError("Subject not found", 404));
    }

    // Find the student and populate their subjects
    const student = await Student.findById(studentId).populate(
      "subjects.subject"
    );
    if (!student) {
      return next(new AppError("Student not found", 404));
    }

    // Check if the student meets the prerequisites for the subject
    const meetsPrerequisites = await student.meetsPrerequisites(subject._id);
    if (!meetsPrerequisites) {
      return next(new AppError("Student does not meet prerequisites", 403));
    }

    // Check for scheduling conflicts with unpassed subjects
    const hasConflict = student.subjects.some((subjectRecord) => {
      if (subjectRecord.subject && !subjectRecord.passed) {
        const existingSubject = subjectRecord.subject;
        return (
          existingSubject.day === subject.day &&
          existingSubject.time === subject.time
        );
      }
      return false;
    });

    if (hasConflict) {
      return next(
        new AppError(
          "Schedule conflict: Another subject is already recorded at the same time on the same day",
          400
        )
      );
    }

    // Record the subject for the student
    const subjectRecord = { subject: subject._id, passed: false };
    student.subjects.push(subjectRecord);
    await student.save();

    res.status(200).json({
      status: "success",
      data: {
        student,
      },
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

exports.getSubjectFilesByName = async (req, res, next) => {
  try {
    const { subjectName } = req.params;

    // Find the subject by name
    const subject = await Subject.findOne({ name: subjectName });

    // Check if subject exists
    if (!subject) {
      return res.status(404).json({
        status: "error",
        message: "Subject not found",
      });
    }

    // If the logged-in user is a student
    if (req.user.role === "student") {
      // Find the student by ID and populate the subjects field
      const student = await Student.findById(req.user._id).populate(
        "subjects.subject"
      );

      // Check if the student is enrolled in the requested subject
      const enrolledSubjects = student.subjects.map((sub) => sub.subject.name);
      if (!enrolledSubjects.includes(subjectName)) {
        return res.status(403).json({
          status: "error",
          message: "You are not enrolled in this subject",
        });
      }
    }

    // If the logged-in user is a doctor
    if (req.user.role === "doctor") {
      // Check if the doctor teaches the requested subject
      if (!req.user.subjects.includes(subject._id.toString())) {
        return res.status(403).json({
          status: "error",
          message: "You are not assigned to this subject",
        });
      }
    }

    // Get the lectures for the specified subject
    const lectures = await Lecture.find({ subject: subject._id });

    // Return the lecture files along with subject data
    res.status(200).json({
      status: "success",
      data: {
        lectures: lectures,
      },
    });
  } catch (error) {
    next(error);
  }
};
exports.getSubjectAssignments = async (req, res, next) => {
  try {
    const { subjectName } = req.params;

    // Find the subject by name
    const subject = await Subject.findOne({ name: subjectName });

    if (!subject) {
      return res
        .status(404)
        .json({ status: "error", message: "Subject not found" });
    }

    // If the logged-in user is a student
    if (req.user.role === "student") {
      // Find the student by ID and populate the subjects field
      const student = await Student.findById(req.user._id).populate(
        "subjects.subject"
      );

      // Check if the student is enrolled in the requested subject
      const enrolledSubjects = student.subjects.map((sub) => sub.subject.name);
      if (!enrolledSubjects.includes(subjectName)) {
        return res.status(403).json({
          status: "error",
          message: "You are not enrolled in this subject",
        });
      }
    }

    // If the logged-in user is a doctor
    if (req.user.role === "doctor") {
      // Check if the doctor teaches the requested subject
      if (!req.user.subjects.includes(subject._id.toString())) {
        return res.status(403).json({
          status: "error",
          message: "You are not assigned to this subject",
        });
      }
    }

    // Fetch all assignments for the specific subject
    const assignments = await Assignment.find({ subject: subject._id });

    res.status(200).json({ status: "success", data: { assignments } });
  } catch (error) {
    next(error);
  }
};
exports.uploadAssignmentSolution = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    const fileUrl = req.file.path; // Assuming multer has saved the file to disk
    const userId = req.user._id; // Assuming userId is available in the request user object
    // Find the assignment by ID
    const assignment = await Assignment.findById(assignmentId);

    // If the logged-in user is a student
    if (req.user.role === "student") {
      // Find the student by ID and populate the subjects field
      const student = await Student.findById(req.user._id).populate(
        "subjects.subject"
      );

      // Check if the student is enrolled in the requested subject
      const enrolledSubjects = student.subjects.map((sub) => sub.subject._id);
      if (!enrolledSubjects.includes(assignment.subject)) {
        return res.status(403).json({
          status: "error",
          message: "You are not enrolled in this subject",
        });
      }
    }

    // Check if assignment exists
    if (!assignment) {
      return res
        .status(404)
        .json({ status: "error", message: "Assignment not found" });
    }
    // Check if the deadline has passed
    const now = new Date();
    if (now > assignment.deadline) {
      return res.status(403).json({
        status: "error",
        message: "Deadline has passed. You cannot upload your solution.",
      });
    }

    // Create a new AssignmentSolution document
    const assignmentSolution = new AssignmentSolution({
      assignment: assignmentId,
      student: userId,
      fileUrl: fileUrl,
    });

    // Save the new assignment solution
    await assignmentSolution.save();

    res.status(201).json({
      status: "success",
      message: "Assignment solution uploaded successfully",
      data: {
        assignmentSolution,
      },
    });
  } catch (error) {
    next(error);
  }
};
exports.MySubjects = catchAsync(async (req, res, next) => {
  try {
    // Extract the student's ID from the authentication token
    const studentId = req.user.id;

    // Find the student
    const student = await Student.findById(studentId);
    if (!student) {
      return next(new AppError("Student not found", 404));
    }

    // Get subjects that the student has already recorded and passed
    const passedSubjects = student.subjects
      .filter((subject) => subject.passed)
      .map((subject) => subject.subject);
    const availableSubjects = await Subject.find({
      $and: [
        {
          $or: [
            { prerequisites: { $exists: false } }, // Subjects with no prerequisites
            { prerequisites: { $size: 0 } }, // Subjects with empty prerequisites array
            {
              prerequisites: {
                $elemMatch: { subject: { $in: passedSubjects } },
              },
            }, // Subjects with prerequisites matching passed subjects
          ],
        },
        { _id: { $nin: passedSubjects } }, // Exclude passed subjects
      ],
    });

    res.status(200).json({
      status: "success",
      data: {
        subjects: availableSubjects.map((subject) => subject.name),
      },
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
});
/*
exports.getStudentSchedule = catchAsync(async (req, res, next) => {
  try {
    // Extract the student's ID from the authentication token
    const studentId = req.user.id;

    // Find the student and populate the subjects
    const student = await Student.findById(studentId).populate(
      "subjects.subject"
    );

    if (!student) {
      return next(new AppError("Student not found", 404));
    }

    // Prepare an array to hold the schedule data
    let schedule = [];

    // Iterate through the subjects recorded by the student
    for (const subjectRecord of student.subjects) {
      if (subjectRecord.subject) {
        const subject = await Subject.findById(subjectRecord.subject._id);

        // Ensure subject and its fields are valid
        if (!subject) {
          console.error(
            `Subject not found for subject record ${subjectRecord.subject._id}`
          );
          continue; // Skip to the next iteration
        }

        // Push subject details to the schedule array
        schedule.push({
          subjectName: subject.name,
          classroom: subject.classroom,
          day: subject.day,
          time: subject.time,
        });
      }
    }

    res.status(200).json({
      status: "success",
      data: {
        schedule: schedule,
      },
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
});*/

exports.getStudentSchedule = catchAsync(async (req, res, next) => {
  try {
    // Extract the student's ID from the authentication token
    const studentId = req.user.id;

    // Find the student and populate the subjects
    const student = await Student.findById(studentId).populate(
      "subjects.subject"
    );

    if (!student) {
      return next(new AppError("Student not found", 404));
    }

    // Prepare an array to hold the schedule data
    let schedule = [];

    // Iterate through the subjects recorded by the student
    for (const subjectRecord of student.subjects) {
      if (subjectRecord.subject && !subjectRecord.passed) {
        const subject = subjectRecord.subject;

        // Ensure subject and its fields are valid
        if (!subject) {
          console.error(
            `Subject not found for subject record ${subjectRecord.subject._id}`
          );
          continue; // Skip to the next iteration
        }

        // Push subject details to the schedule array
        schedule.push({
          subjectName: subject.name,
          classroom: subject.classroom,
          day: subject.day,
          time: subject.time,
        });
      }
    }

    res.status(200).json({
      status: "success",
      data: {
        schedule: schedule,
      },
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
});
exports.getAvailableSubjects = catchAsync(async (req, res, next) => {
  try {
    // Extract the student's ID from the authentication token
    const studentId = req.user.id;

    // Find the student
    const student = await Student.findById(studentId);
    if (!student) {
      return next(new AppError("Student not found", 404));
    }

    // Get subjects that the student has already recorded and passed
    const passedSubjects = student.subjects
      .filter((subject) => subject.passed)
      .map((subject) => subject.subject.toString()); // Convert to string for comparison

    // Get subjects that the student has already recorded (passed or not)
    const recordedSubjects = student.subjects.map((subject) =>
      subject.subject.toString()
    ); // Convert to string for comparison

    // Fetch all subjects that are available for enrollment
    const availableSubjects = await Subject.find({
      $or: [
        {
          $and: [
            { prerequisites: { $exists: false } }, // Subjects with no prerequisites
            { prerequisites: { $size: 0 } }, // Subjects with empty prerequisites array
          ],
        },
        {
          prerequisites: {
            $not: {
              $elemMatch: { subject: { $in: passedSubjects } },
            },
          },
        }, // Subjects with no prerequisites matching passed subjects
      ],
      _id: { $nin: recordedSubjects }, // Exclude subjects already recorded
    });

    res.status(200).json({
      status: "success",
      data: {
        subjects: availableSubjects.map((subject) => subject.name),
      },
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

exports.getRecordedSubjects = catchAsync(async (req, res, next) => {
  try {
    // Extract the student's ID from the authentication token
    const studentId = req.user.id;

    // Find the student
    const student = await Student.findById(studentId).populate(
      "subjects.subject"
    );
    if (!student) {
      return next(new AppError("Student not found", 404));
    }

    // Extract recorded subjects from the student's subjects array
    const recordedSubjects = student.subjects.map((subjectRecord) => ({
      subjectName: subjectRecord.subject.name,
      passed: subjectRecord.passed,
    }));

    res.status(200).json({
      status: "success",
      data: {
        subjects: recordedSubjects,
      },
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

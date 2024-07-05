const User = require("../models/userModel");
const Doctor = require("../models/doctorModel");
const Student = require("../models/studentModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const Subject = require("../models/subjectModel");
const multer = require("multer");
const xlsx = require("xlsx");

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getAllDoctors = catchAsync(async (req, res, next) => {
  // Check if there's a user associated with the request
  if (!req.user) {
    return next(new AppError("You need to log in first", 401));
  }

  try {
    const users = await Doctor.find();

    // SEND RESPONSE
    res.status(200).json({
      status: "success",
      results: users.length,
      data: {
        users,
      },
    });
  } catch (err) {
    // Check if the error is due to lack of permission
    if (err.message === "Unauthorized role") {
      // Return an error response indicating lack of permission
      return res.status(403).json({
        status: "error",
        message: "You do not have permission to access this route",
      });
    }

    // For other errors, pass to the global error handler
    return next(err);
  }
});

exports.getAllStudents = catchAsync(async (req, res, next) => {
  // Check if there's a user associated with the request
  if (!req.user) {
    return next(new AppError("You need to log in first", 401));
  }

  try {
    const users = await Student.find();

    // SEND RESPONSE
    res.status(200).json({
      status: "success",
      results: users.length,
      data: {
        users,
      },
    });
  } catch (err) {
    // Check if the error is due to lack of permission
    if (err.message === "Unauthorized role") {
      // Return an error response indicating lack of permission
      return res.status(403).json({
        status: "error",
        message: "You do not have permission to access this route",
      });
    }

    // For other errors, pass to the global error handler
    return next(err);
  }
});

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for password updates. Please use /updateMyPassword.",
        400
      )
    );
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(req.body, "name", "email");

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.getUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not yet defined!",
  });
};
exports.createStudent = catchAsync(async (req, res) => {
  // Extract student data from the request body
  const {
    name,
    email,
    password,
    passwordConfirm,
    birthDate,
    dateOfAcceptance,
    region,
    gender,
    department,
  } = req.body;

  // Create a new student document
  const student = await Student.create({
    name,
    email,
    password,
    passwordConfirm,
    birthDate,
    dateOfAcceptance,
    region,
    gender,
    department,

    // You can set the role to 'student' for new students
  });

  // Send success response
  res.status(201).json({
    status: "success",
    data: {
      student,
    },
  });
});

exports.createDoctor = catchAsync(async (req, res) => {
  // Extract student data from the request body
  const {
    name,
    email,
    password,
    passwordConfirm,
    birthDate,
    DateOfHiring,
    region,
    gender,
    department,
  } = req.body;

  // Create a new student document
  const doctor = await Doctor.create({
    name,
    email,
    password,
    passwordConfirm,
    role: "doctor",
    birthDate,
    DateOfHiring,
    region,
    gender,
    department, // You can set the role to 'student' for new students
  });

  // Send success response
  res.status(201).json({
    status: "success",
    data: {
      doctor,
    },
  });
});

exports.updateUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not yet defined!",
  });
};
exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not yet defined!",
  });
};

exports.addSubject = async (req, res, next) => {
  try {
    const {
      name,
      prerequisites = [],
      passingGrade,
      level,
      department,
      classroom,
      time,
      day,
    } = req.body;

    // Function to convert prerequisite names to ObjectId
    const getPrerequisiteIds = async (prerequisites) => {
      const prerequisiteIds = [];
      for (const prereqName of prerequisites) {
        const prereqSubject = await Subject.findOne({ name: prereqName });
        if (prereqSubject) {
          prerequisiteIds.push({ subject: prereqSubject._id });
        } else {
          // Handle case where prerequisite subject is not found
          throw new Error(`Prerequisite subject "${prereqName}" not found`);
        }
      }
      return prerequisiteIds;
    };

    let prerequisiteIds = [];
    if (Array.isArray(prerequisites) && prerequisites.length > 0) {
      prerequisiteIds = await getPrerequisiteIds(prerequisites);
    }

    // Find the existing subject by name
    let subject = await Subject.findOne({ name });

    if (subject) {
      // If subject exists, update its details
      subject.prerequisites = prerequisiteIds;
      subject.passingGrade = passingGrade;
      subject.level = level;
      subject.department = department;
      subject.classroom = classroom;
      subject.time = time;
      subject.day = day;

      await subject.save(); // Save the updated subject
    } else {
      // If subject doesn't exist, create a new one
      subject = await Subject.create({
        name,
        prerequisites: prerequisiteIds,
        passingGrade,
        level,
        department,
        classroom,
        time,
        day,
      });
    }

    res.status(201).json({
      status: "success",
      data: {
        subject,
      },
    });
  } catch (error) {
    next(error);
  }
};
exports.getAllSubjects = catchAsync(async (req, res, next) => {
  // Check if there's a user associated with the request
  if (!req.user) {
    return next(new AppError("You need to log in first", 401));
  }

  try {
    const subjects = await Subject.find().select("name");

    // SEND RESPONSE
    res.status(200).json({
      status: "success",
      results: subjects.length,
      data: {
        subjects,
      },
    });
  } catch (err) {
    // Check if the error is due to lack of permission
    if (err.message === "Unauthorized role") {
      // Return an error response indicating lack of permission
      return res.status(403).json({
        status: "error",
        message: "You do not have permission to access this route",
      });
    }

    // For other errors, pass to the global error handler
    return next(err);
  }
});

exports.getStudentByEmail = async (req, res, next) => {
  try {
    // Extract the email parameter from the request
    const { email } = req.params;

    // Find the student by email
    const student = await Student.findOne({ email });

    // If student not found, return appropriate response
    if (!student) {
      return res.status(404).json({
        status: "error",
        message: "Student not found.",
      });
    }

    // Send success response with student data
    res.status(200).json({
      status: "success",
      data: {
        student,
      },
    });
  } catch (error) {
    next(error); // Pass any errors to the global error handler
  }
};

exports.getDoctorByEmail = async (req, res, next) => {
  try {
    // Extract the email parameter from the request
    const { email } = req.params;

    // Find the doctor by email
    const doctor = await Doctor.findOne({ email });

    // If doctor not found, return appropriate response
    if (!doctor) {
      return res.status(404).json({
        status: "error",
        message: "Doctor not found.",
      });
    }

    // Send success response with doctor data
    res.status(200).json({
      status: "success",
      data: {
        doctor,
      },
    });
  } catch (error) {
    next(error); // Pass any errors to the global error handler
  }
};

// Endpoint to add subjects to a doctor

exports.addSubjectsToDoctor = async (req, res, next) => {
  try {
    const { doctorId, subjectName } = req.body;

    // Find the doctor by ID
    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res
        .status(404)
        .json({ status: "error", message: "Doctor not found" });
    }

    // Find the subject by name
    const subject = await Subject.findOne({ name: subjectName });
    if (!subject) {
      return next(new AppError("Subject not found", 404));
    }

    // Check if the subject ID already exists in the doctor's subjects array
    if (doctor.subjects.includes(subject._id)) {
      return res.status(400).json({
        status: "error",
        message: "Subject already added to doctor",
      });
    }

    // Update the doctor's subjects array with the found subject ID
    doctor.subjects.push(subject._id);
    await doctor.save();

    res.status(200).json({ status: "success", data: doctor });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

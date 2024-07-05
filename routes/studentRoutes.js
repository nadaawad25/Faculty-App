/*const express = require("express");
const router = express.Router();
const studentController = require("../controllers/studentController");
const authController = require("../controllers/authController");
const subjectController = require("../controllers/subjectController");
const upload = require("../utils/uploadfile");

router.get(
  "/available-subjects",
  authController.protect,
  studentController.getAvailableSubjects
);
// Route to record a subject for a student
router.post(
  "/record-subject",
  authController.protect,
  studentController.recordSubject
);
router.get(
  "/subjects/:subjectName/files",
  authController.protect,
  studentController.getSubjectFilesByName
);
router.get(
  "/subjects/:subjectName/assigments",
  authController.protect,
  studentController.getSubjectAssignments
);

// Route to upload assignment solutions
router.post(
  "/assignments/:assignmentId/upload",
  authController.protect,
  authController.restrictTo("student"),
  upload.single("assignmentFile"),
  studentController.uploadAssignmentSolution
);

// Route to get the student's schedule
router.get(
  "/schedule",
  authController.protect,
  subjectController.getStudentSchedule
);

module.exports = router;
*/
const express = require("express");
const router = express.Router();
const studentController = require("../controllers/studentController");
const authController = require("../controllers/authController");
const subjectController = require("../controllers/subjectController");
const upload = require("../utils/uploadfile");

router.get("/mysubjects", authController.protect, studentController.MySubjects);
router.get(
  "/available-subjects",
  authController.protect,
  studentController.getAvailableSubjects
);
router.get(
  "/getRecordedSubjects",
  authController.protect,
  studentController.getRecordedSubjects
);

// Route to record a subject for a student
router.post(
  "/record-subject",
  authController.protect,
  studentController.recordSubject
);

router.get(
  "/subjects/:subjectName/files",
  authController.protect,
  studentController.getSubjectFilesByName
);

router.get(
  "/subjects/:subjectName/assignments",
  authController.protect,
  studentController.getSubjectAssignments
);

// Route to upload assignment solutions
router.post(
  "/assignments/:assignmentId/upload",
  authController.protect,
  authController.restrictTo("student"),
  upload.single("assignmentFile"),
  studentController.uploadAssignmentSolution
);

// Route to get the student's schedule
router.get(
  "/schedule",
  authController.protect,
  studentController.getStudentSchedule
);

module.exports = router;

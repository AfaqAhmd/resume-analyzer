const express = require('express');
const { signUp, login, home } = require('../Controller/auth');
const authorization = require("../Authentication/authenticate")

// const { saveResume, analyzeJobWithResume } = require("../Controller/resumeController");

const {  saveResume,  analyzeJobWithResume,  uploadResumePdf, getResumeStatus} = require("../Controller/resumeController");

const router = express.Router();

const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

router.post('/signup', signUp);
router.post('/login', login);
router.get('/home' , authorization, home);


// 1) Resume save / update
router.post("/resume/save", saveResume);

// 2) Compare saved resume with job description
router.post("/resume/analyze-job", analyzeJobWithResume);

router.get("/resume/status", getResumeStatus);


router.post("/resume/upload-pdf", upload.single("resumePdf"), uploadResumePdf);

module.exports = router;
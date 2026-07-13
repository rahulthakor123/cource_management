import express from 'express'
import { requireAuth } from "@clerk/express";
import { addCourse, educatorDashboardData, getEducatorCourses, getEnrolledStudentsData, updateRoleToEducator } from '../controllers/educatorController.js'
import upload from '../configs/multer.js';
import { protectEducator } from '../middlewares/authMiddleware.js';


const educatorRouter = express.Router()

// Add Educator Role
educatorRouter.get('/update-role', requireAuth(),updateRoleToEducator)
educatorRouter.post('/add-course', requireAuth(), upload.single('image'),
protectEducator,addCourse)
educatorRouter.get('/courses',requireAuth(),protectEducator, getEducatorCourses)
educatorRouter.get('/dashboard', requireAuth(),protectEducator, educatorDashboardData)
educatorRouter.get('/enrolled-students',requireAuth(),protectEducator, getEnrolledStudentsData)


export default educatorRouter;


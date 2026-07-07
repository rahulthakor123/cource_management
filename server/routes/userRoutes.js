import express from 'express'
import { getUserData, purchaseCourse, userEnrolledCourses } from '../controllers/userController.js'
import { requireAuth } from '@clerk/express'


const userRouter = express.Router()

userRouter.get('/data', getUserData)
userRouter.get('/enrolled-courses', userEnrolledCourses)
userRouter.post('/purchase',requireAuth(), purchaseCourse)

export default userRouter
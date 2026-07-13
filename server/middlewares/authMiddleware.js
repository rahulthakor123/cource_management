import { clerkClient } from "@clerk/express";


// Middleware (Project Educator Routes )

export const protectEducator = async (req, res, next) => {
    try {
        console.log("req.auth:", req.auth);

        const userId = req.auth?.userId;
        console.log("userId:", userId);

        const response = await clerkClient.users.getUser(userId);

        if (response.publicMetadata.role !== "educator") {
            return res.json({
                success: false,
                message: "Unauthorized Access",
            });
        }

        next();
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            message: error.message,
        });
    }
};
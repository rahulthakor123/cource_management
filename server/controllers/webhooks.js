import { Webhook } from 'svix'
import User from "../models/User.js"
import { Purchase } from '../models/Purchase.js';
import Course from '../models/Course.js';
import Stripe from 'stripe';

// // API Controller Function to Manage Cleark User with database

// export const clerkWebhooks = async (req , res )=>{
//     try{
//         const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET)

//         await whook.verify(JSON.stringify(req.body),{
//             "svix-id" : req.headers["svix-id"],
//             "svix-timestamp": req.headers["svix-timestamp"],
//             "svix-signature" : req.headers["svix-signature"],

//         })

//         const {data, type} = req.body

//         switch(type) {
//             case 'user.created':{

//                 const userData = {
//                     _id: data.id,
//                     email: data.email_addresses[0].email_address,
//                     name: data.first_name + " " + data.last_name,
//                     imageUrl: data.image_url,
//                 }
//                    await User.create(userData)
//                    res.json({})
//                    break;

//             }

//             case 'user.updated': {
                 
//                 const userData = {
//                     email: data.email_addresses[0].email_address,
//                     name: data.first_name + " " + data.last_name,
//                     imageUrl: data.image_url,
//                 }
//                 await User.findByIdAndUpdate(data.id, userData)
//                 res.json({})
//                 break;
//             }

//             case 'user.deleted' : {
//                 await User.findByIdAndDelete(data.id)
//                 res.json({})
//                 break;
//             }

//                  default: 
//                      break;
//         }

//     }catch(error){
//         console.log("❌ Webhook Error:", error);
//         res.json({ success: false, message: error.message })
//     }
// }    




export const clerkWebhooks = async (req, res) => {
  try {
    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

    // Convert Buffer to string
    const payload = req.body.toString();

    const headers = {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    };

    // Verify and get the parsed event
    const evt = whook.verify(payload, headers);

    const { data, type } = evt;

    console.log("Event:", type);

    switch (type) {
      case "user.created": {
        const userData = {
          _id: data.id,
          email: data.email_addresses[0].email_address,
          name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
          imageUrl: data.image_url,
        };

        console.log(userData);

        await User.create(userData);

        console.log("User saved");

        return res.json({ success: true });
      }

      case "user.updated": {
        await User.findByIdAndUpdate(data.id, {
          email: data.email_addresses[0].email_address,
          name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
          imageUrl: data.image_url,
        });

        return res.json({ success: true });
      }

      case "user.deleted": {
        await User.findByIdAndDelete(data.id);

        return res.json({ success: true });
      }

      default:
        return res.json({ success: true });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY)

  export const stripeWebhooks = async(request, response)=>{

     const sig = request.headers['stripe-signature'];

     let event;

     try{
        event = stripeInstance.webhooks.constructEvent(request.body, sig,process.env.
          STRIPE_WEBHOOK_SECRET );
     }catch(error){
          console.error(error);
    return response.status(400).send(`Webhook Error: ${error.message}`);
     }

     //Handle the event
     switch (event.type) {
      case 'payment_intent.succeeded':{
        const paymentIntent = event.data.object;
        const paymentIntentId = paymentIntent.id;

        const session = await stripeInstance.checkout.sessions.list({
          payment_intent: paymentIntentId
        })

        const { purchaseId } = session.data[0].metadata;

        const purchaseData = await Purchase.findById(purchaseId)
        const userData = await User.findById(purchaseData.userId)
        const courseData = await Course.findById(purchaseData.courseId.toString())

        courseData.enrolledStudents.push(userData)
        await courseData.save()

        userData.enrolledCourses.push(courseData._id)
        await userData.save()

        purchaseData.status = 'completed'
        await purchaseData.save()

        break;
      }
      case 'payment_intent.payment_failed':{
        const paymentIntent = event.data.object;
        const paymentIntentId = paymentIntent.id;

        const session = await stripeInstance.checkout.sessions.list({
          payment_intent: paymentIntentId
        })

        const { purchaseId } = session.data[0].metadata;
        const purchaseData = await Purchase.findById(purchaseId)
        purchaseData.status = 'failed'
        await purchaseData.save()
        
        break;
      }
        // ... handle other event types
        default: 
        console.log(`unhandled event type ${event.type}`);
     }

     // Return a response to acknowledge receipt of the event
     response.json({received: true });
}
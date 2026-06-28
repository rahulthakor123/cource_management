import { Webhook } from 'svix'
import User from "../models/User.js"


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
import dotenv from "dotenv"
dotenv.config();
import mongoose from "mongoose"
import dns from "node:dns"
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['1.1.1.1', '8.8.8.8']);
let conectDb = async()=>{
try{
      const sucess = await mongoose.connect(process.env.MONGO_URI);
  if(sucess){
    console.log("database is connectd sucessfully")
  }
}catch(err){
  console.log("an error occured whiel connecting to the database", err.message)
}
}
export default conectDb
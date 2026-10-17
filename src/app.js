import express from "express"
import {PORT} from "./config/env.js"

const app= express();


app.get("/", (req, res)=>{
    res.send("hello world");
})

console.log(PORT)

app.listen(PORT,()=>{
    console.log(`server is running on port ${PORT}`)
})

export default app;
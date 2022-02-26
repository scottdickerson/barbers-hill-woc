import apiRouter from "./routes/apiRoutes";
import express, { Request, Response } from "express";
import pug from "pug";
import path from "path";
import { connectToDB } from "./mongoUtils";
import uiRouter, { pugPagesHome } from "./routes/uiRoutes";
import cors from "cors";

const app = express();

connectToDB().catch(console.dir);

console.log("turning off cors");
app.use(cors());

// setup UI routes
app.use("/ui", uiRouter);

// setup API routes
app.use("/api", apiRouter);

app.use("/scripts", (...args) => express.static("src/scripts")(...args));

app.get("/", (req: Request, res: Response) => {
  res.send(pug.renderFile(path.join(pugPagesHome, "mainNavigation.pug")));
});
// parse json
app.use(express.json());

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});

export default app;

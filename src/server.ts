import express, { NextFunction, Request, Response } from "express";
import pug from "pug";
import path from "path";
import formidable from "formidable";
import mongoDB, { MongoClient, ObjectId } from "mongodb";
import { IChampion } from "./types";
import { omit } from "lodash";

const app = express();

// Replace the uri string with your MongoDB deployment's connection string.
const uri = `mongodb+srv://${process.env.MONGO_USER}:${
  process.env.MONGO_PASS
}@${process.env.MONGO_HOSTNAME || "127.0.0.1"}${
  process.env.MONGO_PORT ? ":" + process.env.MONGO_PORT || "27017" : ""
}/?retryWrites=true&w=majority`;

const client = new MongoClient(uri);
let imagesDatabaseConnection: mongoDB.Collection;

async function connectToDB() {
  await client.connect();
  const database = client.db("barbers-hill");
  imagesDatabaseConnection = database.collection("wall-of-champions");
  console.log("connected to the barbers hill mongo database");
}

connectToDB().catch(console.dir);

const pugPagesHome = path.join(__dirname, "..", "src", "pages");

const form = formidable({
  filename: (name, ext, { originalFilename }) => originalFilename || name,
  keepExtensions: false,
  uploadDir: path.join(__dirname, "..", "dist", "images"),
});

app.get("/ui/editChampion.html", async (req: Request, res: Response) => {
  const id = req.params.id;
  console.log("champion id to load", id);

  try {
    const champion = (await imagesDatabaseConnection.findOne({
      id,
    })) as IChampion;
    console.log("found champion", champion);
    res.send(
      pug.renderFile(path.join(pugPagesHome, "editChampion.pug"), champion)
    );
  } catch (error) {
    console.error(error);
    console.log("error creating image");
  }
});

app.get("/ui/uploadChampion.html", (req: Request, res: Response) => {
  res.send(pug.renderFile(path.join(pugPagesHome, "uploadChampion.pug")));
});

app.get("/ui/mainNavigation.html", (req: Request, res: Response) => {
  res.send(pug.renderFile(path.join(pugPagesHome, "mainNavigation.pug")));
});

app.get("/ui/listChampions.html", async (req: Request, res: Response) => {
  const champions = (await imagesDatabaseConnection.find({}).toArray()).sort(
    ({ year: year1 }, { year: year2 }) => year1 - year2 // sort it by year
  ) as IChampion[];
  console.log("listing champions", champions);
  res.send(
    pug.renderFile(path.join(pugPagesHome, "listChampions.pug"), { champions })
  );
});

const parseForm = (req: Request, res: Response, next: NextFunction) => {
  try {
    form.parse(req, async (err, fields, files) => {
      if (err) {
        next(err);
      }

      const isUpdate = Boolean(req.params?.id);
      console.log("Is this an update? ", isUpdate);
      const id =
        req.params?.id || // passed as a param if editing, first check the edit case, otherwise it's a new file
        (files.videoFile as formidable.File)?.newFilename; // I'm sure this is only one file at a time

      const newChampion = {
        ...fields,
        year: parseInt(fields.year as string, 10),
        // TODO: actually upload file
      };

      console.log("uploading new champion", JSON.stringify(newChampion));

      try {
        if (isUpdate) {
          await imagesDatabaseConnection.replaceOne(
            { id },
            { ...omit(newChampion, "_id") },
            {
              upsert: true,
            }
          );
        } else {
          await imagesDatabaseConnection.insertOne(newChampion);
        }
      } catch (error) {
        console.error(error);
        console.log("error creating/updating champion");
        res.sendStatus(500);
      }
      res.setHeader(
        "location",
        "/ui/mainNavigation.html" // TODO: just testing pug
        // isUpdate ? "/ui/listVideos.html" : "/ui/mainNavigation.html"
      );
      res.sendStatus(301);
    });
  } catch (error) {
    console.log("error parsing the form or uploading the image file");
    console.error(error);
  }
};

// create champion
app.post("/api", (req: Request, res: Response, next: NextFunction) => {
  parseForm(req, res, next);
});

// update champion
app.post("/api/:id", (req: Request, res: Response, next: NextFunction) => {
  parseForm(req, res, next);
});

app.delete(
  "/api/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req?.params?.id;
    console.log("deleting champion", id);
    await imagesDatabaseConnection.deleteOne({
      _id: new ObjectId(id),
    });
  }
);

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

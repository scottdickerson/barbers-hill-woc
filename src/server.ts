import express, { NextFunction, Request, Response } from "express";
import pug from "pug";
import path from "path";
import formidable, { File } from "formidable";
import mongoDB, { MongoClient, ObjectId, GridFSBucket } from "mongodb";
import { IChampion } from "./types";
import { omit } from "lodash";
import { Writable } from "stream";

const app = express();

// Replace the uri string with your MongoDB deployment's connection string.
const uri = process.env.MONGO_HOSTNAME
  ? `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_HOSTNAME}/?retryWrites=true&w=majority`
  : `mongodb://127.0.0.1:${
      process.env.MONGO_PORT ? process.env.MONGO_PORT : "27017"
    }`;

const client = new MongoClient(uri);
let championsDatabaseCollection: mongoDB.Collection;
let imagesBucket: mongoDB.GridFSBucket;
let imagesDatabaseCollection: mongoDB.Collection;

const IMAGES_BUCKET_NAME = "woc-images";

async function connectToDB() {
  await client.connect();
  const database = client.db("barbers-hill");
  championsDatabaseCollection = database.collection("wall-of-champions");
  console.log(
    `connected to the barbers hill mongo database here: ${
      process.env.MONGO_HOSTNAME || "mongodb://127.0.0.1:27017"
    }`
  );
  imagesBucket = new GridFSBucket(database, { bucketName: IMAGES_BUCKET_NAME });
  imagesDatabaseCollection = database.collection(`${IMAGES_BUCKET_NAME}.files`);
}

const handleWriteImageFileToMongo = (file: File): Writable => {
  // this is broken so is not passing the filename
  console.log("writing file to mongo bucket", file.newFilename);
  return imagesBucket.openUploadStream(file.newFilename);
};
connectToDB().catch(console.dir);

const pugPagesHome = path.join(__dirname, "..", "src", "pages");

const form = formidable({
  filename: (name, ext, { originalFilename }) => originalFilename || name,
  keepExtensions: false,
  uploadDir: path.join(__dirname, "..", "dist", "images"),
  fileWriteStreamHandler: handleWriteImageFileToMongo,
});

app.get(
  "/ui/editChampion.html/:championId",
  async (req: Request, res: Response) => {
    const id = req.params.championId;
    console.log("champion id to load", id);

    try {
      const champion = (await championsDatabaseCollection.findOne({
        _id: new ObjectId(id),
      })) as IChampion;
      console.log("found champion", champion);
      if (champion) {
        res.send(
          pug.renderFile(path.join(pugPagesHome, "editChampion.pug"), champion)
        );
      } else {
        res.sendStatus(404);
      }
    } catch (error) {
      console.error(error);
      console.log("error creating image");
    }
  }
);

app.get("/ui/uploadChampion.html", (req: Request, res: Response) => {
  res.send(pug.renderFile(path.join(pugPagesHome, "uploadChampion.pug")));
});

app.get("/ui/mainNavigation.html", (req: Request, res: Response) => {
  res.send(pug.renderFile(path.join(pugPagesHome, "mainNavigation.pug")));
});

app.get("/ui/listChampions.html", async (req: Request, res: Response) => {
  const champions = (await championsDatabaseCollection.find({}).toArray()).sort(
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
      const championId = req.params?.id;
      const isUpdate = Boolean(championId);
      console.log("Is this an update? ", isUpdate); // passed as a param if editing, first check the edit case, otherwise it's a new file
      const fileName = (files.imageFile as formidable.File)?.newFilename; // I'm sure this is only one file at a time

      const newChampion = {
        ...fields,
        year: parseInt(fields.year as string, 10),
        fileName:
          fileName !== "invalid-name" ? fileName : fields?.oldImageFileName,
        // TODO: actually upload file
      };

      try {
        if (isUpdate) {
          console.log(
            "updating existing champion",
            JSON.stringify(newChampion)
          );
          await championsDatabaseCollection.replaceOne(
            { _id: new ObjectId(championId) },
            { ...omit(newChampion, "_id", "oldImageFileName") }
          );
          // TODO: delete the old image out of the database if it no longer matches
        } else {
          console.log("uploading new champion", JSON.stringify(newChampion));
          await championsDatabaseCollection.insertOne(newChampion);
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

// load champion image

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
    const uniqueChampionObjectId = {
      _id: new ObjectId(id),
    };
    const championToDelete = (await championsDatabaseCollection.findOne(
      uniqueChampionObjectId
    )) as IChampion;
    console.log("champion filename to delete", championToDelete.fileName);
    await championsDatabaseCollection.deleteOne(uniqueChampionObjectId);

    // find the id of the image to delete from GridFS
    const imageToDelete = await imagesDatabaseCollection.findOne({
      filename: championToDelete.fileName,
    });
    console.log("image to delete", imageToDelete);
    if (imageToDelete) {
      await imagesBucket.delete(imageToDelete._id);
    }
    res.sendStatus(200);
  }
);

// This is used to send images back to the <img src tags in our documents
app.get("/api/:imageFileName", (req: Request, res: Response) => {
  const fileName = req?.params?.imageFileName;
  console.log("downloading filename", fileName);
  if (fileName) {
    try {
      const readableImage = imagesBucket.openDownloadStreamByName(fileName);
      // write the file
      readableImage.pipe(res);
    } catch (error) {
      console.error(error);
      console.log("error returning image", fileName);
    }
  } else {
    console.error("Cannot find filename", fileName);
  }
});

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

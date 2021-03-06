import express, { NextFunction, Request, Response } from "express";
import { parseForm, uploadFiles } from "../multerUtils";
import {
  findChampions,
  deleteChampionInMongo,
  getImageStreamFromMongo,
} from "../mongoUtils";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  // send back the champions
  // console.log("api get route");
  res.json(await findChampions());
});

// load champion image

// create champion
router.post("/", uploadFiles, parseForm);

// update champion
router.post("/:id", uploadFiles, parseForm);

router.delete(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req?.params?.id;
    console.log("deleting champion", id);
    const championDeleted = await deleteChampionInMongo(id);
    if (championDeleted) {
      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  }
);

// This is used to send images back to the <img src tags in our documents
router.get("/:imageFileName", async (req: Request, res: Response) => {
  const fileName = req?.params?.imageFileName;
  //console.log("downloading filename", fileName);
  if (fileName) {
    try {
      const readableImage = await getImageStreamFromMongo(fileName);
      // write the file
      readableImage.pipe(res);
    } catch (error) {
      console.error(error);
      console.log("error returning image", fileName);
    }
  } else {
    res.send(400);
    console.error("Missing the filename to return");
  }
});

export default router;

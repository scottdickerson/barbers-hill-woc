import {
  updateChampionInMongo,
  createChampionInMongo,
  uri,
  databaseName,
  IMAGES_BUCKET_NAME,
} from "./mongoUtils";
import { IChampion } from "./types";
import { Request, Response, NextFunction } from "express";
import { ObjectId } from "mongodb";
import multer from "multer";
const { GridFsStorage } = require("multer-gridfs-storage");

var storage = new GridFsStorage({
  url: uri + databaseName,
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req: Request, file: { originalname: string }) => {
    return {
      bucketName: IMAGES_BUCKET_NAME,
      filename: file.originalname,
    };
  },
});

export const uploadFiles = multer({ storage: storage }).single("imageFile");

const MAX_FILE_SIZE_MB = 3;

export const parseForm = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("parsing form!");
    console.log(req.file, req.body);
    const file = req.file;
    const params = req.body;
    const fileName = file?.filename;
    const championId = req.params?.id;
    const isUpdate = Boolean(championId);
    console.log("Is this an update? ", isUpdate); // passed as a param if editing, first check the edit case, otherwise it's a new file
    const oldImageFileName = params?.oldImageFileName as string;
    const newChampion: IChampion = {
      id: new ObjectId(),
      sport: params.sport as string,
      year: parseInt(params.year as string, 10),
      description: params.description as string,
      award: params.award as string,
      fileName:
        fileName !== "invalid-name" && fileName !== "null" && fileName
          ? fileName
          : oldImageFileName,
    };

    try {
      if (isUpdate) {
        console.log("updating existing champion", JSON.stringify(newChampion));
        await updateChampionInMongo(championId, newChampion, oldImageFileName);
      } else {
        console.log("uploading new champion", JSON.stringify(newChampion));
        await createChampionInMongo(newChampion);
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
  } catch (error) {
    console.log("error parsing the form or uploading the image file");
    console.error(error);
  }
};

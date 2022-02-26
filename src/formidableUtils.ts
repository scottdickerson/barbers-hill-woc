import formidable from "formidable";
import path from "path";
import {
  handleWriteImageFileToMongo,
  updateChampionInMongo,
  createChampionInMongo,
} from "./mongoUtils";
import { IChampion } from "./types";
import { Request, Response, NextFunction } from "express";
import { ObjectId } from "mongodb";

const MAX_FILE_SIZE_MB = 3;

const form = formidable({
  filename: (name, ext, { originalFilename }) => originalFilename || name,
  maxFileSize: MAX_FILE_SIZE_MB * 1024 * 1024,
  keepExtensions: false,
  uploadDir: path.join(__dirname, "..", "dist", "images"),
  ...(!process.env.HEROKU
    ? { fileWriteStreamHandler: handleWriteImageFileToMongo }
    : {}),
});

export const parseForm = (req: Request, res: Response, next: NextFunction) => {
  try {
    form.parse(req, async (err, fields, files) => {
      if (err) {
        next(err);
      }
      const championId = req.params?.id;
      const isUpdate = Boolean(championId);
      console.log("Is this an update? ", isUpdate); // passed as a param if editing, first check the edit case, otherwise it's a new file
      const uploadedFile = files.imageFile as formidable.File;
      const fileName = uploadedFile?.newFilename; // I'm sure this is only one file at a time
      // TODO: better type fields from form in formidable ahead of time
      const newChampion: IChampion = {
        id: new ObjectId(),
        sport: fields.sport as string,
        year: parseInt(fields.year as string, 10),
        description: fields.description as string,
        award: fields.award as string,
        fileName:
          fileName !== "invalid-name" && fileName !== "null" && fileName
            ? fileName
            : (fields?.oldImageFileName as string),
        // TODO: actually upload file
      };

      try {
        if (isUpdate) {
          console.log(
            "updating existing champion",
            JSON.stringify(newChampion)
          );
          await updateChampionInMongo(championId, newChampion);
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
    });
  } catch (error) {
    console.log("error parsing the form or uploading the image file");
    console.error(error);
  }
};

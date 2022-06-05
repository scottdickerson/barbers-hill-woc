import express, { Request, Response } from "express";
const router = express.Router();
import pug from "pug";
import path from "path";
import { findChampionMetadataInMongo, findChampions } from "../mongoUtils";

export const pugPagesHome = path.join(__dirname, "..", "..", "src", "pages");

router.get(
  "/editChampion.html/:championId",
  async (req: Request, res: Response) => {
    const id = req.params.championId;
    console.log("champion id to load", id);

    try {
      const champion = await findChampionMetadataInMongo(id);
      console.log("found champion", champion);
      if (champion) {
        res.send(
          pug.renderFile(path.join(pugPagesHome, "editChampion.pug"), {
            ...champion,
            // heroku: process.env.ENVIRONMENT === "heroku",
          })
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

router.get("/uploadChampion.html", (req: Request, res: Response) => {
  res.send(pug.renderFile(path.join(pugPagesHome, "uploadChampion.pug")));
});

router.get("/mainNavigation.html", (req: Request, res: Response) => {
  res.send(
    pug.renderFile(path.join(pugPagesHome, "mainNavigation.pug"), {
      // heroku: process.env.ENVIRONMENT === "heroku",
    })
  );
});

router.get("/listChampions.html", async (req: Request, res: Response) => {
  try {
    const champions = await findChampions();
    res.send(
      pug.renderFile(path.join(pugPagesHome, "listChampions.pug"), {
        champions: champions.sort(
          (champion1, champion2) => champion2.year - champion1.year
        ),
        // heroku: process.env.ENVIRONMENT === "heroku",
      })
    );
  } catch (error) {
    res.send(error).sendStatus(500);
  }
});

export default router;

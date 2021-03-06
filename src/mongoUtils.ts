import mongoDB, { MongoClient, ObjectId, GridFSBucket } from "mongodb";
import { IChampion } from "./types";
import { omit } from "lodash";

export const databaseName = process.env.TEST_DB || "barbers-hill";

export async function connectToDB() {
  await client.connect();
  const database = client.db(databaseName);
  championsDatabaseCollection = database.collection("wall-of-champions");
  console.log(
    `connected to the barbers hill mongo database ${databaseName} here: ${
      process.env.MONGO_HOSTNAME || "mongodb://127.0.0.1:27017"
    }`
  );
  imagesBucket = new GridFSBucket(database, { bucketName: IMAGES_BUCKET_NAME });
  imagesDatabaseCollection = database.collection(`${IMAGES_BUCKET_NAME}.files`);
}

// Replace the uri string with your MongoDB deployment's connection string.
export const uri = process.env.MONGO_HOSTNAME
  ? `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_HOSTNAME}/`
  : `mongodb://127.0.0.1:${
      process.env.MONGO_PORT ? process.env.MONGO_PORT : "27017"
    }/`;

const client = new MongoClient(uri);
let championsDatabaseCollection: mongoDB.Collection;
let imagesBucket: mongoDB.GridFSBucket;
let imagesDatabaseCollection: mongoDB.Collection;

export const IMAGES_BUCKET_NAME = "woc-images";

export const disconnectFromDB = async () => {
  await client.close();
};

export const findChampionMetadataInMongo = (id: string) => {
  return championsDatabaseCollection.findOne({
    _id: new ObjectId(id),
  }) as Promise<IChampion>;
};

export const findChampionsMetadataInMongo = async () => {
  return (
    ((await championsDatabaseCollection?.find({})?.toArray())?.sort(
      ({ year: year1 }, { year: year2 }) => year1 - year2 // sort it by year
    ) as IChampion[]) || []
  );
};

export const updateChampionInMongo = async (
  championId: string,
  champion: IChampion,
  oldImageFileName: string
) => {
  await championsDatabaseCollection.replaceOne(
    { _id: new ObjectId(championId) },
    {
      ...omit(champion, "_id", "oldImageFileName"),
    }
  );
  if (champion.fileName !== oldImageFileName) {
    console.log("deleting original image", oldImageFileName);
    const originalImageToDelete = await findImageFileInGridFS(oldImageFileName);
    if (originalImageToDelete) {
      await imagesBucket.delete(originalImageToDelete._id);
    }
  }
};

export const createChampionInMongo = (champion: IChampion) => {
  return championsDatabaseCollection.insertOne(champion);
};

const findImageFileInGridFS = (fileName: string) => {
  // find the id of the image to delete from GridFS
  return imagesDatabaseCollection.findOne({
    filename: fileName,
  });
};

export const deleteChampionInMongo = async (id: string): Promise<boolean> => {
  let championDeleted = false;
  const uniqueChampionObjectId = {
    _id: new ObjectId(id),
  };
  const championToDelete = (await championsDatabaseCollection.findOne(
    uniqueChampionObjectId
  )) as IChampion;
  console.log("champion filename to delete", championToDelete.fileName);
  const deletedInfo = await championsDatabaseCollection.deleteOne(
    uniqueChampionObjectId
  );
  if (deletedInfo.deletedCount > 0) {
    const imageToDelete = await findImageFileInGridFS(
      championToDelete.fileName
    );
    console.log("image to delete", imageToDelete);
    if (imageToDelete) {
      await imagesBucket.delete(imageToDelete._id);
    }
  } else {
    console.warn("warning I could not find the image file to delete");
  }
  return championDeleted;
};

export const getImageStreamFromMongo = async (imageFileName: string) => {
  const imageToDelete = await findImageFileInGridFS(imageFileName);
  if (!imageToDelete) {
    throw new Error(`Image file doesn't exist in mongo ${imageFileName}`);
  }
  const readableImage = imagesBucket.openDownloadStreamByName(imageFileName);
  // console.log("opened download stream for ", imageFileName);
  return readableImage;
};

export const findChampions = async (): Promise<IChampion[]> => {
  try {
    const champions = await findChampionsMetadataInMongo();
    // console.log("listing champions", champions);
    return champions;
  } catch (error) {
    console.error("couldn't find champions");
  }
  throw new Error("couldn't query database champions");
};

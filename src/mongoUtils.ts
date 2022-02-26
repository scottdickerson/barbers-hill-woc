import mongoDB, { MongoClient, ObjectId, GridFSBucket } from "mongodb";
import { File } from "formidable";
import stream, { Writable } from "stream";
import { IChampion } from "./types";
import { omit } from "lodash";

export async function connectToDB() {
  await client.connect();
  const databaseName = process.env.TEST_DB || "barbers-hill";
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

export const updateChampionInMongo = (
  championId: string,
  champion: IChampion
) => {
  return championsDatabaseCollection.replaceOne(
    { _id: new ObjectId(championId) },
    { ...omit(champion, "_id", "oldImageFileName") }
  );
  // TODO: delete the old image out of the database if it no longer matches
};

export const createChampionInMongo = (champion: IChampion) => {
  return championsDatabaseCollection.insertOne(champion);
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
    // find the id of the image to delete from GridFS
    const imageToDelete = await imagesDatabaseCollection.findOne({
      filename: championToDelete.fileName,
    });
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
  const readableImage = imagesBucket.openDownloadStreamByName(imageFileName);
  return readableImage;
};

export const handleWriteImageFileToMongo = (file: File): Writable => {
  if (file.newFilename !== "invalid-name") {
    console.log("writing file to mongo bucket", file.newFilename);
    return imagesBucket.openUploadStream(file.newFilename);
  }
  return new stream.Writable(); // don't do anything here
};

export const findChampions = async (): Promise<IChampion[]> => {
  try {
    const champions = await findChampionsMetadataInMongo();
    console.log("listing champions", champions);
    return champions;
  } catch (error) {
    console.error("couldn't find champions");
  }
  throw new Error("couldn't query database champions");
};

import { Document, ObjectId, WithId } from "mongodb";
export interface IChampion extends Partial<WithId<Document>> {
  sport: string;
  award: string;
  year: number;

  description: string;

  fileName: string;

  id: ObjectId;
}

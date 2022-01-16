import { Document, ObjectId, WithId } from "mongodb";
export interface IChampion extends WithId<Document> {
  sport: string;
  award: string;
  year: number;

  description: string;

  id: ObjectId;
}

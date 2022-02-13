import supertest, { SuperTest, Test } from "supertest";
import { disconnectFromDB } from "../mongoUtils";
let request: SuperTest<Test>;
import app from "../server";

describe("api routes testing", () => {
  beforeAll(() => {
    request = supertest(app);
  });
  it("get images empty", async () => {
    const result = await request.get("/api/champions");
    expect(result.body).toEqual([]);
  });
  afterAll(() => {
    disconnectFromDB();
  });
});

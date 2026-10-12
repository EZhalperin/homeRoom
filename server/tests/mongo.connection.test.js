import { connectMongo, getDb, getCollection, closeMongo } from "../src/config/mongo.js";

class FakeDb {
  collection(name) {
    return { name };
  }
}

class FakeClient {
  constructor() {
    FakeClient.instances += 1;
    this.closed = false;
  }
  on() {}
  async connect() {
    FakeClient.connects += 1;
  }
  db() {
    return new FakeDb();
  }
  async close() {
    this.closed = true;
    FakeClient.closed += 1;
  }
}
FakeClient.instances = 0;
FakeClient.connects = 0;
FakeClient.closed = 0;

class FailClient {
  on() {}
  async connect() {
    throw new Error("connect failed");
  }
  db() {
    return new FakeDb();
  }
  async close() {
    FailClient.closed += 1;
  }
}
FailClient.closed = 0;

describe("connectMongo", () => {
  afterEach(async () => {
    await closeMongo();
    FakeClient.instances = 0;
    FakeClient.connects = 0;
    FakeClient.closed = 0;
    FailClient.closed = 0;
  });

  test("shares one in-flight connect across concurrent callers", async () => {
    const [a, b] = await Promise.all([connectMongo(FakeClient), connectMongo(FakeClient)]);
    expect(a).toBe(b);
    expect(FakeClient.instances).toBe(1);
    expect(FakeClient.connects).toBe(1);
    expect(getDb()).toBe(a);
    expect(getCollection("classes").name).toBe("classes");
  });

  test("resets after failure so a retry can succeed", async () => {
    await expect(connectMongo(FailClient)).rejects.toThrow("connect failed");
    expect(FailClient.closed).toBe(1);
    const db = await connectMongo(FakeClient);
    expect(db).toBeDefined();
    expect(FakeClient.connects).toBe(1);
  });

  test("getDb throws when not connected", async () => {
    expect(() => getDb()).toThrow(/not connected/);
  });

  test("closeMongo is idempotent", async () => {
    await connectMongo(FakeClient);
    await closeMongo();
    await closeMongo();
    expect(FakeClient.closed).toBe(1);
    expect(() => getDb()).toThrow(/not connected/);
  });
});

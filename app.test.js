const request = require("supertest");
const Users = require("./models/users");
const app = require("./app");
const mongoose = require("mongoose");

afterAll(async () => {
  await mongoose.connection.close();
});

describe("POST /api/users", () => {
  describe("given a username and password", () => {
    beforeEach(async () => {
      await Users.deleteOne({ username: "test0" });
    });

    test("should respond with a status code 201", async () => {
      const response = await request(app).post("/api/users").send({
        username: "test0",
        password: "test0",
      });
      expect(response.statusCode).toBe(201);
    });

    test("should specify json in content type header", async () => {
      const response = await request(app).post("/api/users").send({
        username: "test0",
        password: "test0",
      });
      expect(response.headers["content-type"]).toEqual(
        expect.stringContaining("json")
      );
    });

    test("response has userid", async () => {
      const response = await request(app).post("/api/users").send({
        username: "test0",
        password: "test0",
      });
      expect(response.body._id).toBeDefined;
    });
  });

  describe("when username or password is missing", () => {
    test("should respond with a status code 400", async () => {
      const bodyData = [{ username: "test0" }, { password: "test0" }, {}];
      for (const body of bodyData) {
        const response = await request(app).post("/api/users").send(body);
        expect(response.statusCode).toBe(400);
      }
    });
  });

  describe("when username exists", () => {
    test("should respond with a status code 409", async () => {
      const response = await request(app).post("/api/users").send({
        username: "user0",
        password: "qwerty",
      });
      expect(response.statusCode).toBe(409);
    });
  });
});

describe("POST /api/users/login", () => {
  describe("given a valid username and password", () => {
    test("should respond with a status code 200", async () => {
      const response = await request(app).post("/api/users/login").send({
        username: "user0",
        password: "user0",
      });
      expect(response.statusCode).toBe(200);
    });
    test("should specify json in content type header", async () => {
      const response = await request(app).post("/api/users/login").send({
        username: "user0",
        password: "user0",
      });
      expect(response.headers["content-type"]).toEqual(
        expect.stringContaining("json")
      );
    });
    test("response has auth token", async () => {
      const response = await request(app).post("/api/users/login").send({
        username: "user0",
        password: "user0",
      });
      expect(response.body.token).toBeDefined;
    });
  });
  describe("when username or password is missing", () => {
    test("should respond with a status code 401", async () => {
      const bodyData = [{ username: "user0" }, { password: "user0" }, {}];
      for (const body of bodyData) {
        const response = await request(app).post("/api/users/login").send(body);
        expect(response.statusCode).toBe(401);
      }
    });
  });
  describe("when password is wrong", () => {
    test("should respond with a status code 401", async () => {
      const response = await request(app).post("/api/users/login").send({
        username: "user0",
        password: "qwerty",
      });
      expect(response.statusCode).toBe(401);
    });
  });
  describe("when user does not exist", () => {
    test("should respond with a status code 401", async () => {
      const response = await request(app).post("/api/users/login").send({
        username: "notexist",
        password: "qwerty",
      });
      expect(response.statusCode).toBe(401);
    });
  });
});

describe("POST /api/transactions/deposit", () => {
  describe("when logged in", () => {
    let token;
    beforeAll(async () => {
      const response = await request(app).post("/api/users/login").send({
        username: "test0",
        password: "test0",
      });
      token = response.body.token;
    });

    test("should respond with a status code 201", async () => {
      const response = await request(app)
        .post("/api/transactions/deposit")
        .set("Authorization", `Bearer ${token}`)
        .send({
          amount: 500,
        });
      expect(response.statusCode).toBe(201);
    });

    test("transaction type should be 'CR' and purpose should be 'deposit'", async () => {
      const response = await request(app)
        .post("/api/transactions/deposit")
        .set("Authorization", `Bearer ${token}`)
        .send({
          amount: 500,
        });
      expect(response.body).toHaveProperty(
        ["transaction", "transactionType"],
        "CR"
      );
      expect(response.body).toHaveProperty(
        ["transaction", "purpose"],
        "deposit"
      );
    });

    test("balance should equal 1000", async () => {
      const response = await request(app)
        .post("/api/transactions/deposit")
        .set("Authorization", `Bearer ${token}`)
        .send({
          amount: 500,
        });
      expect(response.body).toHaveProperty(
        ["transaction", "balanceAfter", "$numberDecimal"],
        "1500"
      );
    });
  });

  describe("when not logged in", () => {
    test("should respond with a status code 404", async () => {
      const response = await request(app)
        .post("/api/transactions/deposit")
        .send({
          amount: 1000,
        });
      expect(response.statusCode).toBe(404);
    });
  });
});

describe("POST /api/transactions/withdraw", () => {
  describe("when logged in", () => {
    let token;
    beforeAll(async () => {
      const response = await request(app).post("/api/users/login").send({
        username: "test0",
        password: "test0",
      });
      token = response.body.token;
    });

    test("should respond with a status code 201", async () => {
      const response = await request(app)
        .post("/api/transactions/withdraw")
        .set("Authorization", `Bearer ${token}`)
        .send({
          amount: 100,
        });
      expect(response.statusCode).toBe(201);
    });

    test("transaction type should be 'DR' and purpose should be 'withdrawal'", async () => {
      const response = await request(app)
        .post("/api/transactions/withdraw")
        .set("Authorization", `Bearer ${token}`)
        .send({
          amount: 500,
        });
      expect(response.body).toHaveProperty(
        ["transaction", "transactionType"],
        "DR"
      );
      expect(response.body).toHaveProperty(
        ["transaction", "purpose"],
        "withdrawal"
      );
    });

    test("balance should equal 1000", async () => {
      const response = await request(app)
        .post("/api/transactions/withdraw")
        .set("Authorization", `Bearer ${token}`)
        .send({
          amount: 100,
        });
      expect(response.body).toHaveProperty(
        ["transaction", "balanceAfter", "$numberDecimal"],
        "800"
      );
    });
  });

  describe("when logged in with insufficient balance", () => {
    let token;
    beforeAll(async () => {
      const response = await request(app).post("/api/users/login").send({
        username: "test0",
        password: "test0",
      });
      token = response.body.token;
    });

    test("should respond with a status code 400", async () => {
      const response = await request(app)
        .post("/api/transactions/withdraw")
        .set("Authorization", `Bearer ${token}`)
        .send({
          amount: 1000,
        });
      expect(response.statusCode).toBe(400);
    });
  });

  describe("when not logged in", () => {
    test("should respond with a status code 404", async () => {
      const response = await request(app)
        .post("/api/transactions/withdraw")
        .send({
          amount: 200,
        });
      expect(response.statusCode).toBe(404);
    });
  });
});

describe("POST /api/transactions/transfer", () => {
  describe("when logged in", () => {
    let token;
    beforeAll(async () => {
      await Users.deleteOne({ username: "test1" });
      const response = await request(app).post("/api/users/login").send({
        username: "test0",
        password: "test0",
      });
      const createUserResponse = await request(app).post("/api/users").send({
        username: "test1",
        password: "test1",
      });
      token = response.body.token;
    });

    test("should respond with a status code 201", async () => {
      const response = await request(app)
        .post("/api/transactions/transfer")
        .set("Authorization", `Bearer ${token}`)
        .send({
          beneficiary: "test1",
          summary: "Test transaction",
          amount: 100,
        });
      expect(response.statusCode).toBe(201);
    });

    test("user balance should equal 600 and beneficiary balance should be 200", async () => {
      const response = await request(app)
        .post("/api/transactions/transfer")
        .set("Authorization", `Bearer ${token}`)
        .send({
          beneficiary: "test1",
          summary: "Test transaction",
          amount: 100,
        });
      expect(response.body).toHaveProperty(
        ["transactions", 0, "balanceAfter", "$numberDecimal"],
        "600"
      );
      expect(response.body).toHaveProperty(
        ["transactions", 1, "balanceAfter", "$numberDecimal"],
        "200"
      );
    });
  });

  describe("when logged in with insufficient balance", () => {
    let token;
    beforeEach(async () => {
      const response = await request(app).post("/api/users/login").send({
        username: "test0",
        password: "test0",
      });
      token = response.body.token;
    });

    test("should respond with a status code 400", async () => {
      const response = await request(app)
        .post("/api/transactions/transfer")
        .set("Authorization", `Bearer ${token}`)
        .send({
          beneficiary: "test1",
          summary: "Test transaction",
          amount: 1000,
        });
      expect(response.statusCode).toBe(400);
    });
  });

  describe("when not logged in", () => {
    test("should respond with a status code 404", async () => {
      const response = await request(app)
        .post("/api/transactions/transfer")
        .send({
          beneficiary: "test1",
          summary: "Test transaction",
          amount: 100,
        });
      expect(response.statusCode).toBe(404);
    });
  });
});

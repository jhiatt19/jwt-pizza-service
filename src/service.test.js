const express = require("express");

jest.mock("./routes/authRouter.js", () => {
  const actualExpress = jest.requireActual("express");
  const mockRouter = actualExpress.Router();
  return {
    authRouter: mockRouter,
    setAuthUser: jest.fn(),
    setAuth: jest.fn(),
  };
});

jest.mock("./database/database.js", () => {
  return {
    DB: jest.fn().mockImplementation(() => {
      return {
        getMenu: jest.fn(),
        initializeDatabase: jest.fn().mockResolvedValue(true),
      };
    }),
  };
});

const { DB } = require("./database/database.js");
const request = require("supertest");
const app = require("./service");
const authRouter = require("./routes/authRouter.js");
const userRouter = require("./routes/userRouter.js");

test("GET /me", async () => {
  authRouter.authenticateToken.mockImplementation((req, res, next) => {
    req.user = {
      id: 1,
      name: "bill",
      email: "a@jwt.com",
      roles: [{ role: "admin" }],
    };
    next();
  });

  const response = await request(app).get("/api/user/me");

  expect(response.statusCode).toBe(200);
  expect(response.body.name).toBe("bill");
});

test("Get Menu", async () => {
  const fakeMenu = [
    {
      title: "Student",
      description: "No topping, no sauce, just carbs",
      image: "pizza9.png",
      price: 0.0001,
    },
  ];
  const myDb = new DB();
  myDb.getMenu.mockResolvedValue(fakeMenu);

  const result = await myDb.getMenu();

  expect(result).toEqual(fakeMenu);
  expect(myDb.getMenu).toHaveBeenCalled();
});

// test("login", async () => {
//   const loginRes = await request(app).put("/api/auth").send(testUser);
//   expect(loginRes.status).toBe(200);
//   expect(loginRes.body.token).toMatch(
//     /^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/,
//   );

//   const { password, ...user } = { ...testUser, roles: [{ role: "diner" }] };
//   expect(loginRes.body.user).toMatchObject(user);
//   console.log(loginRes.body);

//   const loginAdmin = await request(app).put("/api/auth").send(adminUser);
//   adminUserAuthToken = loginAdmin.body.token;
// });

// test("get menu", async () => {
//   const menuResult = await request(app).get("/api/order/menu");
//   expect(menuResult.status).toBe(200);

//   const expected = [
//     {
//       id: 1,
//       title: "Veggie",
//       image: "pizza1.png",
//       price: 0.0038,
//       description: "A garden of delight",
//     },
//     {
//       id: 2,
//       title: "Pepperoni",
//       image: "pizza2.png",
//       price: 0.0042,
//       description: "Spicy treat",
//     },
//     {
//       id: 3,
//       title: "Margarita",
//       image: "pizza3.png",
//       price: 0.0042,
//       description: "Essential classic",
//     },
//     {
//       id: 4,
//       title: "Crusty",
//       image: "pizza4.png",
//       price: 0.0028,
//       description: "A dry mouthed favorite",
//     },
//     {
//       id: 5,
//       title: "Charred Leopard",
//       image: "pizza5.png",
//       price: 0.0099,
//       description: "For those with a darker side",
//     },
//   ];
//   expect(menuResult.body).toMatchObject(expected);
// });

// test("add menu", async () => {
//   const addMenuRes = await request(app)
//     .put("/api/order/menu")
//     .set("Authorization", `Bearer ${adminUserAuthToken}`)
//     .send(newMenu);

//   expect(addMenuRes.status).toBe(200);

//   console.log(addMenuRes.body.length);
//   expect(addMenuRes.body.toString()).toMatch(newMenu.toString());
// });

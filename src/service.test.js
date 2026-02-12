const { DB, Role } = require("./database/database.js");
const request = require("supertest");
const app = require("./service");

let testUserAuthToken;
let adminUserAuthToken;
let franchiseUserAuthToken;

function randomName() {
  return Math.random().toString(36).substring(2, 12);
}

async function createUser(role) {
  let user = { password: `${role}-toomanysecrets`, roles: [{ role: role }] };
  user.name = randomName();
  user.email = user.name + `@${role}.com`;
  if (role == Role.Admin) {
    user = await DB.addUser(user);
  }
  console.log(user);
  return { ...user, password: `${role}-toomanysecrets` };
}

let testUser = "diner";
let adminUser = "admin";
let franchiseUser = "franchisee";
const testOrder = {
  franchiseId: 1,
  storeId: 1,
  items: [{ menuId: 1, description: "Veggie", price: 0.05 }],
};

beforeAll(async () => {
  testUser = await createUser(Role.Diner);
  adminUser = await createUser(Role.Admin);
  franchiseUser = await createUser(Role.Franchisee);

  const regTest = await request(app).post("/api/auth").send(testUser);
  expect(regTest.status).toBe(200);
  expect(regTest.body.user.name).toEqual(testUser.name);
  testUserAuthToken = regTest.body.token;

  const franchiseTest = await request(app)
    .post("/api/auth")
    .send(franchiseUser);
  expect(franchiseTest.status).toBe(200);
  expect(franchiseTest.body.user.name).toEqual(franchiseUser.name);
  franchiseUserAuthToken = franchiseTest.body.token;

  const testUserRes = await request(app)
    .delete("/api/auth")
    .set("Authorization", `Bearer ${testUserAuthToken}`);
  expect(testUserRes.status).toBe(200);
  expect(testUserRes.body.message).toMatch("logout successful");

  const franchiseUserRes = await request(app)
    .delete("/api/auth")
    .set("Authorization", `Bearer ${franchiseUserAuthToken}`);
  expect(franchiseUserRes.status).toBe(200);
  expect(franchiseUserRes.body.message).toMatch("logout successful");
  console.log("Set up was successful");
  console.log(`Set up auth token: ${testUserAuthToken}`);
});

test("login diner", async () => {
  const loginRes = await request(app)
    .put("/api/auth")
    .send({ email: testUser.email, password: testUser.password });
  testUserAuthToken = loginRes.body.token;
  expect(loginRes.status).toBe(200);
  expect(loginRes.body.token).toMatch(
    /^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/,
  );
  expect(loginRes.body.user.name).toMatch(testUser.name);
  testUser.id = loginRes.body.user.id;
  console.log(`Login Diner auth token: ${testUserAuthToken}`);
});

test("login Admin", async () => {
  const loginAdmin = await request(app)
    .put("/api/auth")
    .send({ email: adminUser.email, password: adminUser.password });
  adminUserAuthToken = loginAdmin.body.token;

  expect(loginAdmin.body.user.name).toMatch(adminUser.name);
  adminUser.id = loginAdmin.body.user.id;
});

test("get user", async () => {
  const getRes = await request(app)
    .get("/api/user/me")
    .set("Authorization", `Bearer ${testUserAuthToken}`);

  expect(getRes.status).toBe(200);
  expect(getRes.body.name).toMatch(testUser.name);
  testUser.id = getRes.body.id;
});

test("update user", async () => {
  testUser.password = "newPassword";
  console.log(testUser);
  const updateRes = await request(app)
    .put(`/api/user/${testUser.id}`)
    .set("Authorization", `Bearer ${testUserAuthToken}`)
    .send({
      name: testUser.name,
      email: testUser.email,
      password: testUser.password,
    });
  expect(updateRes.status).toBe(200);
  testUserAuthToken = updateRes.body.token;
  expect(updateRes.body.user.name).toMatch(testUser.name);
  console.log(`Update user auth token: ${testUserAuthToken}`);
});

test("create franchise", async () => {
  const franchiseInfo = {
    name: randomName(),
    admins: [{ name: adminUser.name, email: adminUser.email }],
  };

  const createFranchiseResponse = await request(app)
    .post("/api/franchise")
    .set("Authorization", `Bearer ${adminUserAuthToken}`)
    .send(franchiseInfo);
  expect(createFranchiseResponse.status).toBe(200);
  expect(createFranchiseResponse.body.name).toMatch(franchiseInfo.name);
  franchiseInfo.id = createFranchiseResponse.body.id;
});

test("create order", async () => {
  const createOrderRes = await request(app)
    .post("/api/order")
    .set("Authorization", `Bearer ${testUserAuthToken}`)
    .send(testOrder);

  expect(createOrderRes.status).toBe(200);
  expect(createOrderRes.body.order.items[0]).toMatchObject(testOrder.items[0]);
  console.log(createOrderRes.body);
});

test("get orders", async () => {
  console.log(`Get orders auth token: ${testUserAuthToken}`);
  const getOrderRes = await request(app)
    .get("/api/order")
    .set("Authorization", `Bearer ${testUserAuthToken}`);
  console.log(getOrderRes.status, getOrderRes.body);
  expect(getOrderRes.status).toBe(200);
  expect(getOrderRes.body.dinerId).toBe(Number(testUser.id));
});

// test("login Franchisee", async () => {
//   const loginRes = await request(app).put("/api/auth").send(franchiseUser);
//   franchiseUserAuthToken = loginRes.body.token;

//   expect(loginRes.status).toBe(200);
//   expect(loginRes.body.user.name).toMatch(franchiseUser.name);
// });

test("Get Menu", async () => {
  const fakeMenu = {
    title: "Veggie",
    description: "A garden of delight",
    id: 1,
    image: "pizza1.png",
    price: 0.0038,
  };

  const result = await request(app).get("/api/order/menu");
  expect(result.status).toBe(200);
  expect(result.body[0]).toMatchObject(fakeMenu);
});

test("add menu", async () => {
  const newMenu = {
    title: "testPizza",
    image: "pizza1.png",
    price: 1.0,
    description: "Testing McTesty",
  };
  const addMenuRes = await request(app)
    .put("/api/order/menu")
    .set("Authorization", `Bearer ${adminUserAuthToken}`)
    .send(newMenu);

  expect(addMenuRes.status).toBe(200);

  console.log(addMenuRes.body.length);
  expect(addMenuRes.body.toString()).toMatch(newMenu.toString());
  const conn = await DB.getConnection();
  DB.query(conn, "DELETE FROM menu WHERE title = ?", [newMenu.title]);
  conn.end();
});

// afterAll(async () => {
//   const conn = await DB.getConnection();
//   const deleteUsers = [testUser, adminUser];
//   for (const user of deleteUsers) {
//     console.log(user);
//     await DB.query(
//       conn,
//       "DELETE FROM userRole WHERE userId = (SELECT id FROM user WHERE name = ?);",
//       [user.name],
//     );
//     await DB.query(conn, "DELETE FROM user WHERE name = ?", [user.name]);
//   }
//   await conn.end();
// });

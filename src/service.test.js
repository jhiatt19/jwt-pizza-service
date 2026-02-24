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
  return { ...user, password: `${role}-toomanysecrets` };
}

let franchiseInfo;
let testUser = "diner";
let adminUser = "admin";
const testOrder = {
  franchiseId: 1,
  storeId: 1,
  items: [{ menuId: 1, description: "Veggie", price: 0.05 }],
};

const newMenu = {
  title: "Veggie",
  image: "pizza1.png",
  price: 0.0038,
  description: "A garden of delight",
};

beforeAll(async () => {
  testUser = await createUser(Role.Diner);
  adminUser = await createUser(Role.Admin);

  const regTest = await request(app).post("/api/auth").send(testUser);
  expect(regTest.status).toBe(200);
  expect(regTest.body.user.name).toEqual(testUser.name);
  testUserAuthToken = regTest.body.token;

  const testUserRes = await request(app)
    .delete("/api/auth")
    .set("Authorization", `Bearer ${testUserAuthToken}`);
  expect(testUserRes.status).toBe(200);
  expect(testUserRes.body.message).toMatch("logout successful");

  franchiseInfo = {
    name: "pizzaPocket1",
    admins: [{ name: testUser.name, email: testUser.email }],
  };
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
});

test("create franchise", async () => {
  const createFranchiseResponse = await request(app)
    .post("/api/franchise")
    .set("Authorization", `Bearer ${adminUserAuthToken}`)
    .send(franchiseInfo);
  expect(createFranchiseResponse.status).toBe(200);
  expect(createFranchiseResponse.body.name).toMatch(franchiseInfo.name);
  franchiseInfo.id = createFranchiseResponse.body.id;
});

test("create store", async () => {
  const createStoreRes = await request(app)
    .post(`/api/franchise/${franchiseInfo.id}/store`)
    .set("Authorization", `Bearer ${testUserAuthToken}`)
    .send({ franchiseId: franchiseInfo.id, name: "SLC" });
  expect(createStoreRes.status).toBe(200);
  expect(createStoreRes.body.name).toMatch("SLC");
});

test("login Franchisee", async () => {
  const loginRes = await request(app).put("/api/auth").send(testUser);
  franchiseUserAuthToken = loginRes.body.token;

  expect(loginRes.status).toBe(200);
  expect(loginRes.body.user.name).toMatch(testUser.name);
});

test("add menu", async () => {
  const addMenuRes = await request(app)
    .put("/api/order/menu")
    .set("Authorization", `Bearer ${adminUserAuthToken}`)
    .send(newMenu);

  expect(addMenuRes.status).toBe(200);
  expect(addMenuRes.body.toString()).toMatch(newMenu.toString());
});

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
  console.log(result.body);
  expect(result.body[0]).toMatchObject(fakeMenu);
});

test("create order", async () => {
  const createOrderRes = await request(app)
    .post("/api/order")
    .set("Authorization", `Bearer ${testUserAuthToken}`)
    .send(testOrder);
  console.log(createOrderRes.body);
  expect(createOrderRes.status).toBe(200);
  expect(createOrderRes.body.order.items[0]).toMatchObject(testOrder.items[0]);
});

test("get orders", async () => {
  const getOrderRes = await request(app)
    .get("/api/order")
    .set("Authorization", `Bearer ${testUserAuthToken}`);
  console.log(getOrderRes.body);
  expect(getOrderRes.status).toBe(200);
  expect(getOrderRes.body.dinerId).toBe(Number(testUser.id));
});

test("get franchises", async () => {
  const getFranchiseRes = await request(app).get(
    "/api/franchise?name=pizzaPocket1",
  );
  expect(getFranchiseRes.status).toBe(200);
  console.log(getFranchiseRes.body);
  expect(getFranchiseRes.body.franchises[0].id).toBe(1);
});

test("get user Franchise", async () => {
  const getFranchiseRes = await request(app)
    .get(`/api/franchise/${testUser.id}`)
    .set("Authorization", `Bearer ${franchiseUserAuthToken}`);
  expect(getFranchiseRes.status).toBe(200);
  expect(getFranchiseRes.body[0].id).toBe(Number(franchiseInfo.id));
});

test("delete franchise", async () => {
  const deleteRes = await request(app).delete(
    `/api/franchise/${franchiseInfo.id}`,
  );
  expect(deleteRes.status).toBe(200);
  expect(deleteRes.body.message).toMatch("franchise deleted");
});

test("list users unauthorized", async () => {
  const listUsersRes = await request(app).get("/api/user");
  expect(listUsersRes.status).toBe(401);
});

test("list users", async () => {
  const listUsersRes = await request(app)
    .get("/api/user")
    .set("Authorization", "Bearer " + adminUserAuthToken);
  expect(listUsersRes.body.users[0]).toMatchObject({
    email: adminUser.email,
    id: adminUser.id,
    name: adminUser.name,
  });
});

test("delete users", async () => {
  const deleteUser = createUser(Role.Diner);
  const deleteUsers = await request(app)
    .delete(`/api/user/${deleteUser.id}`)
    .set("Authorization", "Bearer " + adminUserAuthToken);
  expect(deleteUsers.body).toEqual({ message: "user deleted" });
});

afterAll(async () => {
  const conn = await DB.getConnection();
  const deleteUsers = [testUser, adminUser];
  await DB.query(conn, "DELETE FROM menu WHERE title = ?", [newMenu.title]);
  for (const user of deleteUsers) {
    await DB.query(
      conn,
      "DELETE FROM userRole WHERE userId = (SELECT id FROM user WHERE name = ?);",
      [user.name],
    );
    await DB.query(conn, "DELETE FROM user WHERE name = ?", [user.name]);
  }
  await conn.end();
});

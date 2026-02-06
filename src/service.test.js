const request = require("supertest");
const app = require("./service");
const { DB } = require("./database/database.js");
const { Role } = require("./model/model.js");

const testUser = { name: "pizza diner", email: "reg@test.com", password: "a" };
const registerAdmin = () => createAdminUser();
const newMenu = {
  title: "Student",
  description: "No topping, no sauce, just carbs",
  image: "pizza9.png",
  price: 0.0001,
};

const randomname = () => `User_${Math.random().toString(36).substring(2, 9)}`;

async function createAdminUser() {
  let user = { password: "toomanysecrets", roles: [{ role: Role.Admin }] };
  user.name = randomname();
  user.email = user.name + "@admin.com";

  await DB.addUser(user);
  user.password = "toomanysecrets";

  return user;
}

let testUserAuthToken;
let adminUserAuthToken;

beforeAll(async () => {
  testUser.email = Math.random().toString(36).substring(2, 12) + "@test.com";
  const registerRes = await request(app)
    .post("/api/auth")
    .send({ ...testUser, roles: { role: "diner" } });
  testUserAuthToken = registerRes.body.token;

  adminUser = await registerAdmin();
});

test("login", async () => {
  const loginRes = await request(app).put("/api/auth").send(testUser);
  expect(loginRes.status).toBe(200);
  expect(loginRes.body.token).toMatch(
    /^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/,
  );

  const { password, ...user } = { ...testUser, roles: [{ role: "diner" }] };
  expect(loginRes.body.user).toMatchObject(user);
  console.log(loginRes.body);

  const loginAdmin = await request(app).put("/api/auth").send(adminUser);
  adminUserAuthToken = loginAdmin.body.token;
});

test("get menu", async () => {
  const menuResult = await request(app).get("/api/order/menu");
  expect(menuResult.status).toBe(200);

  const expected = [
    {
      id: 1,
      title: "Veggie",
      image: "pizza1.png",
      price: 0.0038,
      description: "A garden of delight",
    },
    {
      id: 2,
      title: "Pepperoni",
      image: "pizza2.png",
      price: 0.0042,
      description: "Spicy treat",
    },
    {
      id: 3,
      title: "Margarita",
      image: "pizza3.png",
      price: 0.0042,
      description: "Essential classic",
    },
    {
      id: 4,
      title: "Crusty",
      image: "pizza4.png",
      price: 0.0028,
      description: "A dry mouthed favorite",
    },
    {
      id: 5,
      title: "Charred Leopard",
      image: "pizza5.png",
      price: 0.0099,
      description: "For those with a darker side",
    },
  ];
  expect(menuResult.body).toMatchObject(expected);
});

test("add menu", async () => {
  const addMenuRes = await request(app)
    .put("/api/order/menu")
    .set("Authorization", `Bearer ${adminUserAuthToken}`)
    .send(newMenu);

  expect(addMenuRes.status).toBe(200);

  console.log(addMenuRes.body.length);
  expect(addMenuRes.body.toString()).toMatch(newMenu.toString());
});

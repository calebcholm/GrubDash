const path = require('path');

// Use the existing dishes data
const dishes = require(path.resolve('src/data/dishes-data'));

// Use this function to assign ID's when necessary
const nextId = require('../utils/nextId');

// TODO: Implement the /dishes handlers needed to make the tests pass
function list(req, res) {
  const { orderId } = req.params;
  res.json({
    data: dishes.filter(
      orderId ? dish => dish.id === Number(orderId) : () => true
    ),
  });
}

//id, name, description, price, image_url
function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({ status: 400, message: `Must include property: '${propertyName}'` });
  };
}

function create(req, res) {
  const { data: { id, name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find(dish => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish id not found: '${dishId}'`,
  });
}

function read(req, res) {
  res.json({ data: res.locals.dish });
}

function update(req, res) {
  const dish = res.locals.dish;
  const {
    data: { name, description, price, image_url },
  } = req.body;

  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;

  res.json({ data: dish });
}

function priceIsValid(req, res, next) {
  const { data: { price } = {} } = req.body;
  if (price <= 0 || typeof price !== 'number') {
    return next({
      status: 400,
      message: `price must be a number greater than 0`,
    });
  }
  next();
}

module.exports = {
  create: [
    bodyDataHas('name'),
    bodyDataHas('description'),
    bodyDataHas('price'),
    bodyDataHas('image_url'),
    priceIsValid,
    create,
  ],
  list,
  read: [dishExists, read],
  update: [
    dishExists,
    bodyDataHas('name'),
    bodyDataHas('description'),
    bodyDataHas('price'),
    bodyDataHas('image_url'),
    priceIsValid,
    update,
  ],
};

const path = require('path');

// Use the existing order data
const orders = require(path.resolve('src/data/orders-data'));

// Use this function to assigh ID's when necessary
const nextId = require('../utils/nextId');

// TODO: Implement the /orders handlers needed to make the tests pass

function list(req, res) {
  res.json({ data: orders });
}

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({ status: 400, message: `Must include property: '${propertyName}'` });
  };
}

//id, deliverTo, mobileNumber, status, dishes[]
function create(req, res) {
  const { data: { id, deliverTo, mobileNumber, status, dishes } = {} } =
    req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function dishesIsValid(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  if (Array.isArray(dishes) && dishes.length) {
    next();
  }
  return next({
    status: 400,
    message: `Please add dishes to order.`,
  });
}

function dishesQuantityIsValid(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  dishes.forEach((dish, index) => {
    if (
      !dish.quantity ||
      !(Number(dish.quantity) > 0) ||
      typeof dish.quantity !== 'number'
    ) {
      return next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
    }
  });
  next();
}

function idIsValid(req, res, next) {
  const { orderId } = req.params;
  const { data: { id } = {} } = req.body;
  if (id) {
    if (id === orderId) {
      return next();
    }
    return next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
    });
  }
  next();
}

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find(order => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order id not found: ${orderId}`,
  });
}

function update(req, res) {
  const order = res.locals.order;
  const {
    data: { deliverTo, mobileNumber, status, dishes },
  } = req.body;

  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes = dishes;

  res.json({ data: order });
}

function read(req, res, next) {
  res.json({ data: res.locals.order });
}

function statusPending(req, res, next) {
  const status = res.locals.order.status;
  if (status && status === 'pending') {
    return next();
  }
  next({
    status: 400,
    message: 'An order cannot be deleted unless it is pending',
  });
}

function hasValidStatus(req, res, next) {
  const { data: { status } = {} } = req.body;
  if (status === 'pending') {
    next();
  }
  return next({
    status: 400,
    message: `Can't delete. Order no longer pending. Current status: '${status}'.`,
  });
}

function destroy(req, res) {
  const { orderId } = req.params;
  const index = orders.findIndex(order => order.id === orderId);
  const deletedOrders = orders.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
  list,
  read: [orderExists, read],
  create: [
    bodyDataHas('deliverTo'),
    bodyDataHas('mobileNumber'),
    bodyDataHas('dishes'),
    dishesIsValid,
    dishesQuantityIsValid,
    create,
  ],
  update: [
    orderExists,
    bodyDataHas('deliverTo'),
    bodyDataHas('mobileNumber'),
    dishesIsValid,
    idIsValid,
    dishesQuantityIsValid,
    statusPending,
    hasValidStatus,
    update,
  ],
  delete: [orderExists, statusPending, destroy],
  orderExists,
};

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
      orderId ? (dish) => dish.id === Number(orderId) : () => true
    ),
  });
}


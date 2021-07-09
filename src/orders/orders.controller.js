const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));
// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

const orderExists = (req, res, next) => {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.orderId = orderId;
    res.locals.foundOrder = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order does not exist: ${req.params.orderId}`,
  });
};

function isValidOrder(req, res, next) {
  const { deliverTo = "", mobileNumber = "", dishes = [] } = req.body.data;

  if (!deliverTo.length) {
    next({ status: 400, message: "Order must include a deliverTo" });
  }
  if (!mobileNumber.length) {
    next({ status: 400, message: "Order must include a mobileNumber" });
  }
  if (!dishes.length || !Array.isArray(dishes)) {
    next({ status: 400, message: "Order must include at least one dish" });
  }

  for (let dish of dishes) {
    const index = dishes.findIndex((dishId) => dishId.id === dish.id);
    const { quantity } = dish;

    if (!quantity || !Number.isInteger(dish.quantity)) {
      next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
    }
  }
  res.locals.validOrder = req.body.data;
  next();
}

function orderStatus(req, res, next) {
  const { orderId } = req.params;
  const { validOrder } = res.locals;
  const { status = "" } = validOrder;

  if (validOrder.id) {
    if (validOrder.id !== orderId) {
      next({
        status: 400,
        message: `Order id does not match route id. Order: ${validOrder.id}, Route: ${orderId}.`,
      });
    }
  }

  if (status === "" || status === undefined || status === "invalid") {
    next({
      status: 400,
      message:
        "Order must have a status of pending, preparing, out-for-delivery or delivered",
    });
  }

  if (status === "delivered") {
    next({ status: 400, message: "A delivered order cannot be modified" });
  }
  res.locals.orderId = orderId;
  next();
}

function list(req, res) {
  res.json({ data: orders });
}

function read(req, res) {
  res.json({ data: res.locals.foundOrder });
}

function create(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
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

function update(req, res) {
  const { foundOrder } = res.locals;

  const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
  foundOrder.deliverTo = deliverTo;
  foundOrder.mobileNumber = mobileNumber;
  foundOrder.dishes = dishes;
  res.json({ data: foundOrder });
}

function destroy(req, res, next) {
  const { orderId } = res.locals;
  const { foundOrder } = res.locals;
  const index = orders.findIndex((order) => order.id === orderId);

  if (foundOrder.status === "pending") {
    orders.splice(index, 1);
    res.sendStatus(204);
  }
  next({
    status: 400,
    message: "Only pending orders can be deleted",
  });
}

module.exports = {
  create: [isValidOrder, create],
  read: [orderExists, read],
  update: [orderExists, isValidOrder, orderStatus, update],
  delete: [orderExists, destroy],
  list,
};
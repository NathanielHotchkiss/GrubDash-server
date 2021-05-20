const { response } = require("express");
const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

const dishExists = (req, res, next) => {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dishId = dishId;
    res.locals.foundDish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish does not exist: ${dishId}`,
  });
};

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

function isValidDish(req, res, next) {
  const { dishId } = req.params;
  const {
    name = "",
    description = "",
    price = 0,
    image_url = "",
  } = req.body.data;

  if (!name.length) {
    next({ status: 400, message: "A name for the dish is required" });
  }
  if (!description.length) {
    next({ status: 400, message: "A description for the dish is required" });
  }
  if (price <= 0 || price === undefined) {
    next({ status: 400, message: "Dish must include a price greater than 0" });
  }
  if (!Number.isInteger(price)) {
    next({ status: 400, message: "Dish must have a price that is an integer" });
  }
  if (!image_url) {
    next({ status: 400, message: "Dish must include an image_url" });
  }
  if (dishId && req.body.data.id && req.body.data.id !== dishId) {
    next({
      status: 400,
      message: `${req.body.data.id} does not match route id`,
    });
  }
  res.locals.validDish = req.body.data;
  next();
}

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

function list(req, res) {
  res.json({ data: dishes });
}

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

function create(req, res) {
  const { data: { name, price, description, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name,
    price,
    description,
    image_url,
  };

  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

function read(req, res) {
  res.json({ data: res.locals.foundDish });
}

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

function update(req, res) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);

  const { data: { name, price, description, image_url } = {} } = req.body;
  foundDish.name = name;
  foundDish.price = price;
  foundDish.description = description;
  foundDish.image_url = image_url;
  res.json({ data: foundDish });
}

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

module.exports = {
  create: [isValidDish, create],
  read: [dishExists, read],
  update: [dishExists, isValidDish, update],
  list,
};

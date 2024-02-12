const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode ? res.statusCode : 500;
  res.status(statusCode);

  if (err?.code === 11000) {
    res.json({
      status: false,
      message: `${Object?.keys(err?.keyValue)[0]} ${
        err.keyValue[Object?.keys(err?.keyValue)[0]]
      } is already used`,
      stack: process.env.NODE_ENV !== "production" ? err : null,
    });
  }

  if (err?.name === "ValidationError") {
    let storedErrors = Object?.keys(err?.errors);
    console.log("storedErrors", storedErrors);

    if (storedErrors.length) {
      res.json({
        status: false,
        message: `Please provide ${storedErrors?.join(", ")}`,
        stack: process.env.NODE_ENV !== "production" ? err : null,
      });
    }
    res.json({
      status: false,
      message: err,
      json: err,
      stack: process.env.NODE_ENV !== "production" ? err : null,
    });
  }

  res.json({
    message: err,
    json: err,
    stack: process.env.NODE_ENV !== "production" ? err.stack : null,
  });
};

module.exports = {
  errorHandler,
};

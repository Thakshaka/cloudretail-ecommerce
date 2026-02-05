module.exports = {
  $randomString,
  $randomNumber,
  $randomEmail
};

function $randomString() {
  return Math.random().toString(36).substring(7);
}

function $randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function $randomEmail() {
  return `test${$randomString()}@example.com`;
}

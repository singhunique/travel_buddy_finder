function isValidName(name) {
  if (!name || typeof name !== "string") return false;

  const trimmed = name.trim();

  // At least 3 characters, letters and spaces only
  return /^[A-Za-z\s]{3,50}$/.test(trimmed);
}

function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;

  const trimmed = email.trim();

  // Simple but real email validation
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed);
}

function isValidPassword(password) {
  if (!password || typeof password !== "string") return false;

  // At least 6 chars, at least 1 letter and 1 number
  return /^(?=.*[A-Za-z])(?=.*\d).{6,}$/.test(password);
}

function parseInterests(interests) {
  if (!interests || typeof interests !== "string") return [];

  return interests
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function isValidDestination(destination) {
  if (!destination || typeof destination !== "string") return false;

  const trimmed = destination.trim();

  return /^[A-Za-z\s]{2,60}$/.test(trimmed);
}

function isValidDateRange(startDate, endDate) {
  if (!startDate || !endDate) return false;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return false;
  }

  return start <= end;
}

module.exports = {
  isValidName,
  isValidEmail,
  isValidPassword,
  parseInterests,
  isValidDestination,
  isValidDateRange
};


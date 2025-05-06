'use strict';

const bcrypt = require('bcryptjs');

async function hashPassword(password, saltRounds = 10) {
  try {
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  } catch (error) {
    throw new Error(`Error hashing password: ${error.message}`);
  }
}

async function verifyPassword(password, hash) {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    throw new Error(`Error verifying password: ${error.message}`);
  }
}

module.exports = {
  hashPassword,
  verifyPassword
};
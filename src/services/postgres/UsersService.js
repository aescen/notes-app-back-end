const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const { customAlphabet } = require('nanoid/non-secure');
const AuthenticationsError = require('../../exceptions/AuthenticationsError');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 16);

class UsersService {
  constructor() {
    this._pool = new Pool();
  }

  async addUser({ username, password, fullname }) {
    await this.verifyNewUsername(username);

    const id = `user-${nanoid()}`;
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = {
      text: 'INSERT INTO users VALUES($1, $2, $3, $4) RETURNING id',
      values: [id, username, hashedPassword, fullname],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new InvariantError('User gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async verifyNewUsername(username) {
    const query = {
      text: 'SELECT * FROM users WHERE username = $1',
      values: [username],
    };

    const result = await this._pool.query(query);

    if (result.rowCount) {
      throw new InvariantError('Gagal menambahkan user. Username sudah digunakan.');
    }
  }

  async getUserById(userId) {
    const query = {
      text: 'SELECT id, username, fullname FROM users WHERE id = $1',
      values: [userId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('User tidak ditemukan.');
    }

    return result.rows[0];
  }

  async getUsersByUsername(currentsername, username) {
    const query = {
      text: 'SELECT id, username, fullname FROM users WHERE username != $1 AND username LIKE $2',
      values: [currentsername, `%${username}%`],
    };

    const result = await this._pool.query(query);
    return result.rows;
  }

  async verifyUserCredential(username, password) {
    const query = {
      text: 'SELECT id, password FROM users WHERE username = $1',
      values: [String(username)],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new AuthenticationsError('Kredensial yang anda berikan salah.');
    }

    const { id, password: hashedPassword } = result.rows[0];
    const match = await bcrypt.compare(password, hashedPassword);

    if (!match) {
      throw new AuthenticationsError('Kredensial yang anda berikan salah.');
    }

    return id;
  }
}

module.exports = UsersService;

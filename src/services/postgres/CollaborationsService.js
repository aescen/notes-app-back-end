const { Pool } = require('pg');
const { customAlphabet } = require('nanoid/non-secure');
const InvariantError = require('../../exceptions/InvariantError');

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 16);

class CollaborationsService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async addCollaboration(userId, noteId) {
    const collabId = `collab-${nanoid()}`;
    const query = {
      text: 'INSERT INTO collaborations VALUES($1, $2, $3) RETURNING id',
      values: [collabId, userId, noteId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('Kolaborasi berhasil ditambahkan.');
    }

    await this._cacheService.delete(`notes:${userId}`);
    return result.rows[0].id;
  }

  async verifyCollaborator(userId, noteId) {
    const query = {
      text: 'SELECT * FROM collaborations WHERE user_id = $1 AND note_id = $2',
      values: [userId, noteId],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new InvariantError('Kolaborasi gagal diverifikasi.');
    }
  }

  async deleteCollaboration(userId, noteId) {
    const query = {
      text: 'DELETE FROM collaborations WHERE user_id = $1 AND note_id = $2 RETURNING id',
      values: [userId, noteId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('Kolaborasi gagal dihapus.');
    }

    await this._cacheService.delete(`notes:${userId}`);
    await this._cacheService.delete(`note:${noteId}`); //--
  }
}

module.exports = CollaborationsService;

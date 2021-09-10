const { Pool } = require('pg');
const { customAlphabet } = require('nanoid/non-secure');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');
const { mapDbToModel } = require('../../utils');

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 16);

class NotesService {
  constructor(collaborationsService, cacheService) {
    this._pool = new Pool();
    this._collaborationsService = collaborationsService;
    this._cacheService = cacheService;
  }

  async addNote({
    title, body, tags, owner,
  }) {
    const id = nanoid(16);
    const createdAt = new Date().toISOString();

    const query = {
      text: 'INSERT INTO notes VALUES($1, $2, $3, $4, $5, $5, $6) RETURNING id',
      values: [id, title, body, tags, createdAt, owner],
    };

    const result = await this._pool.query(query);

    const resultOk = result.rows[0].id;

    if (!resultOk) {
      throw new InvariantError('Catatan gagal ditambahkan.');
    }

    await this._cacheService.delete(`notes:${owner}`);

    return resultOk;
  }

  async getNotes(owner) {
    try {
      const result = await this._cacheService.get(`notes:${owner}`);
      return JSON.parse(result);
    } catch (error) {
      const query = {
        text: `SELECT notes.* FROM notes
              LEFT JOIN collaborations ON collaborations.note_id = notes.id
              WHERE notes.owner = $1 OR collaborations.user_id = $1
              GROUP BY notes.id`,
        values: [owner],
      };
      const result = await this._pool.query(query);
      const mappedResult = result.rows.map(mapDbToModel);

      await this._cacheService.set(`notes:${owner}`, JSON.stringify(mappedResult));

      return mappedResult;
    }
  }

  async getNoteById(id) {
    //--
    try {
      const result = await this._cacheService.get(`note:${id}`);
      return JSON.parse(result);
    } catch (error) {
      const query = {
        text: `SELECT notes.*, users.username
              FROM notes
              LEFT JOIN users ON users.id = notes.owner
              WHERE notes.id = $1`,
        values: [id],
      };
      const result = await this._pool.query(query);

      if (!result.rowCount) {
        throw new NotFoundError('Catatan tidak ditemukan.');
      }

      const mappedResult = result.rows.map(mapDbToModel)[0];
      await this._cacheService.set(`note:${id}`, JSON.stringify(mappedResult)); //--

      return mappedResult;
    }
  }

  async editNoteById(id, { title, body, tags }) {
    const updatedAt = new Date().toISOString();
    const query = {
      text: 'UPDATE notes SET title = $1, body = $2, tags = $3, updated_at = $4 WHERE id = $5 RETURNING id, owner',
      values: [title, body, tags, updatedAt, id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Gagal memperbarui catatan. Id tidak ditemukan.');
    }

    const { id: noteId, owner } = result.rows[0];
    await this._cacheService.delete(`notes:${owner}`);
    await this._cacheService.delete(`note:${noteId}`); //--
  }

  async deleteNoteById(id) {
    const query = {
      text: 'DELETE FROM notes WHERE id = $1 RETURNING id, owner',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Catatan gagal dihapus. Id tidak ditemukan.');
    }

    const { id: noteId, owner } = result.rows[0];
    await this._cacheService.delete(`notes:${owner}`);
    await this._cacheService.delete(`note:${noteId}`); //--
  }

  async verifyNoteOwner(owner, id) {
    const query = {
      text: 'SELECT * FROM notes WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Catatan tidak ditemukan.');
    }

    const note = result.rows[0];

    if (note.owner !== owner) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini.');
    }
  }

  async verifyNoteAccess(userId, noteId) {
    try {
      await this.verifyNoteOwner(userId, noteId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      try {
        await this._collaborationsService.verifyCollaborator(userId, noteId);
      } catch {
        throw error;
      }
    }
  }
}

module.exports = NotesService;

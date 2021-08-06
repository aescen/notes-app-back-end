const { nanoid } = require('nanoid');

class NotesService {
  constructor() {
    this._notes = [];

    /* this.addNote = this.addNote.bind(this);
    this.getNotes = this.getNotes.bind(this);
    this.getNoteById = this.getNoteById.bind(this);
    this.editNoteById = this.editNoteById.bind(this);
    this.deleteNoteById = this.deleteNoteById.bind(this); */
  }

  addNote({ title, body, tags }) {
    const id = nanoid(16);
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    const newNote = {
      title, tags, body, id, createdAt, updatedAt,
    };

    this._notes.push(newNote);

    const isSuccess = this._notes.filter((note) => note.id === id).length > 0;

    if (!isSuccess) {
      throw new Error('Catatan gagal ditambahkan');
    }

    return id;
  }

  getNotes() {
    return this._notes;
  }

  getNoteById(id) {
    const note = this._notes.filter((n) => n.id === id)[0];
    if (!note) {
      throw new Error('Catatan tidak ditemukan');
    }

    return note;
  }

  editNoteById(id, { title, body, tags }) {
    const updatedAt = new Date().toISOString();
    const index = this._notes.findIndex((note) => note.id === id);

    if (index !== -1) {
      this._notes[index] = {
        ...this._notes[index],
        title,
        tags,
        body,
        updatedAt,
      };
    }
  }

  deleteNoteById(id) {
    const index = this._notes.findIndex((note) => note.id === id);

    if (index === -1) {
      throw new Error('Catatan gagal dihapus. Id tidak ditemukan');
    }

    this._notes.splice(index, 1);
  }
}

module.exports = NotesService;

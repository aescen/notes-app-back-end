class NotesHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    this.postNoteHandler = this.postNoteHandler.bind(this);
    this.getNotesHandler = this.getNotesHandler.bind(this);
    this.getNoteByIdHandler = this.getNoteByIdHandler.bind(this);
    this.putNoteByIdHandler = this.putNoteByIdHandler.bind(this);
    this.deleteNoteByIdHandler = this.deleteNoteByIdHandler.bind(this);
  }

  async postNoteHandler(request, h) {
    const { title = 'untitled', body, tags } = request.payload;
    this._validator.validateNotePayload({ title, body, tags });
    const { id: userId } = request.auth.credentials;

    const noteId = await this._service.addNote({
      title, body, tags, owner: userId,
    });

    const response = h.response({
      status: 'success',
      message: 'Catatan berhasil ditambahkan.',
      data: {
        noteId,
      },
    });
    response.code(201);
    return response;
  }

  async getNotesHandler(request) {
    const { id: userId } = request.auth.credentials;

    const notes = await this._service.getNotes(userId);
    return {
      status: 'success',
      data: {
        notes,
      },
    };
  }

  async getNoteByIdHandler(request) {
    const { id } = request.params;
    const { id: userId } = request.auth.credentials;

    await this._service.verifyNoteAccess(userId, id);
    const note = await this._service.getNoteById(id);
    return {
      status: 'success',
      data: {
        note,
      },
    };
  }

  async putNoteByIdHandler(request) {
    this._validator.validateNotePayload(request.payload);
    const { id } = request.params;
    const { id: userId } = request.auth.credentials;

    await this._service.verifyNoteAccess(userId, id);
    await this._service.editNoteById(id, request.payload);

    return {
      status: 'success',
      message: 'Catatan berhasil diperbarui.',
    };
  }

  async deleteNoteByIdHandler(request) {
    const { id } = request.params;
    const { id: userId } = request.auth.credentials;

    await this._service.verifyNoteOwner(userId, id);
    await this._service.deleteNoteById(id);

    return {
      status: 'success',
      message: 'Catatan berhasil dihapus.',
    };
  }
}

module.exports = NotesHandler;

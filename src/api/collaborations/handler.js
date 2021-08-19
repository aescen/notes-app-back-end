class collaborationsHandler {
  constructor(collaborationsService, notesService, validator) {
    this._collaborationsService = collaborationsService;
    this._notesService = notesService;
    this._validator = validator;

    this.postCollaborationHandler = this.postCollaborationHandler.bind(this);
    this.deleteCollaborationHandler = this.deleteCollaborationHandler.bind(this);
  }

  async postCollaborationHandler(request, h) {
    this._validator.validateCollaborationPayload(request.payload);
    const { id: credentialId } = request.auth.credentials;
    const { userId, noteId } = request.payload;

    await this._notesService.verifyNoteOwner(credentialId, noteId);

    const collaborationId = await this._collaborationsService.addCollaboration(userId, noteId);

    const response = h.response({
      status: 'success',
      message: 'Kolaborasi berhasil ditambahkan.',
      data: {
        collaborationId,
      },
    });
    response.code(201);
    return response;
  }

  async deleteCollaborationHandler(request) {
    this._validator.validateCollaborationPayload(request.payload);
    const { id: credentialId } = request.auth.credentials;
    const { userId, noteId } = request.payload;

    await this._notesService.verifyNoteOwner(credentialId, noteId);

    await this._collaborationsService.deleteCollaboration(userId, noteId);
    return {
      status: 'success',
      message: 'Kolaborasi berhasil dihapus.',
    };
  }
}

module.exports = collaborationsHandler;

/* eslint-disable camelcase */

exports.up = (pgm) => {
  // membuat user old_notes
  pgm.sql("INSERT INTO users(id, username, password, fullname) VALUES('old_notes', 'old_notes', 'old_notes', 'old_notes')");

  // mengubah nilai owner yang bernilai NULL
  pgm.sql("UPDATE notes SET owner = 'old_notes' WHERE owner = NULL");

  // memberikan constraint foreign key pada owner pada table notes
  // terhadap kolom id dari table users
  pgm.addConstraint('notes', 'fk_notes.owner_users.id', 'FOREIGN KEY(owner) REFERENCES users(id) ON DELETE CASCADE');
};

exports.down = (pgm) => {
  // menghapus fk_notes.owner_users.id pada tabel notes
  pgm.dropConstraint('notes', 'fk_notes.owner_users.id');

  // mengubah nilai owner old_notes pada note menjadi NULL
  pgm.sql("UPDATE notes SET owner = NULL WHERE owner = 'old_notes'");

  // menghapus user old_notes
  pgm.sql("DELETE FROM users WHERE id = 'old_notes'");
};

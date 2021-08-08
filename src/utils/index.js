/* eslint-disable camelcase */
const mapDbToModel = ({
  id,
  title,
  body,
  tags,
  created_at,
  updated_at,
}) => ({
  id,
  title,
  body,
  tags,
  creatdAt: created_at,
  updatedAt: updated_at,
});

module.exports = { mapDbToModel };

import knex from './index.js';

export async function listMobTemplateOverrides() {
  return knex('mob_templates')
    .select('template_id', 'data_json', 'updated_at');
}

export async function getMobTemplateOverride(templateId) {
  const id = String(templateId || '').trim();
  if (!id) return null;
  return knex('mob_templates').where({ template_id: id }).first();
}

export async function upsertMobTemplateOverride(templateId, data) {
  const id = String(templateId || '').trim();
  if (!id) throw new Error('template_id is required');
  const payload = JSON.stringify(data || {});
  await knex('mob_templates')
    .insert({ template_id: id, data_json: payload })
    .onConflict('template_id')
    .merge({ data_json: payload, updated_at: knex.fn.now() });
}

export async function deleteMobTemplateOverride(templateId) {
  const id = String(templateId || '').trim();
  if (!id) return 0;
  return knex('mob_templates').where({ template_id: id }).del();
}

"use strict";

const sql = require('./sql');
const utils = require('./utils');
const sync_table = require('./sync_table');
const protected_session = require('./protected_session');

async function getNoteAttributeMap(noteId) {
    return await sql.getMap(`SELECT name, value FROM attributes WHERE noteId = ?`, [noteId]);
}

async function getNoteIdWithAttribute(name, value) {
    return await sql.getFirstValue(`SELECT notes.noteId FROM notes JOIN attributes USING(noteId) 
          WHERE notes.isDeleted = 0 AND attributes.name = ? AND attributes.value = ?`, [name, value]);
}

async function getNotesWithAttribute(dataKey, name, value) {
    let notes;

    if (value !== undefined) {
        notes = await sql.getAll(`SELECT notes.* FROM notes JOIN attributes USING(noteId) 
          WHERE notes.isDeleted = 0 AND attributes.name = ? AND attributes.value = ?`, [name, value]);
    }
    else {
        notes = await sql.getAll(`SELECT notes.* FROM notes JOIN attributes USING(noteId) 
          WHERE notes.isDeleted = 0 AND attributes.name = ?`, [name]);
    }

    for (const note of notes) {
        protected_session.decryptNote(dataKey, note);
    }

    return notes;
}

async function getNoteWithAttribute(dataKey, name, value) {
    const notes = getNotesWithAttribute(dataKey, name, value);

    return notes.length > 0 ? notes[0] : null;
}

async function getNoteIdsWithAttribute(name) {
    return await sql.getFirstColumn(`SELECT DISTINCT notes.noteId FROM notes JOIN attributes USING(noteId) 
          WHERE notes.isDeleted = 0 AND attributes.name = ?`, [name]);
}

async function createAttribute(noteId, name, value = null, sourceId = null) {
    const now = utils.nowDate();
    const attributeId = utils.newAttributeId();

    await sql.insert("attributes", {
        attributeId: attributeId,
        noteId: noteId,
        name: name,
        value: value,
        dateModified: now,
        dateCreated: now
    });

    await sync_table.addAttributeSync(attributeId, sourceId);
}

module.exports = {
    getNoteAttributeMap,
    getNoteIdWithAttribute,
    getNotesWithAttribute,
    getNoteWithAttribute,
    getNoteIdsWithAttribute,
    createAttribute
};
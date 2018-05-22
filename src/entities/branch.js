"use strict";

const Entity = require('./entity');
const dateUtils = require('../services/date_utils');
const repository = require('../services/repository');
const sql = require('../services/sql');

class Branch extends Entity {
    static get tableName() { return "branches"; }
    static get primaryKeyName() { return "branchId"; }
    static get syncedProperties() { return ["branchId", "noteId", "parentNoteId", "notePosition", "dateModified", "isDeleted", "prefix"]; }

    async getNote() {
        return await repository.getEntity("SELECT * FROM notes WHERE noteId = ?", [this.noteId]);
    }

    async beforeSaving() {
        super.beforeSaving();

        if (this.notePosition === undefined) {
            const maxNotePos = await sql.getValue('SELECT MAX(notePosition) FROM branches WHERE parentNoteId = ? AND isDeleted = 0', [this.parentNoteId]);
            this.notePosition = maxNotePos === null ? 0 : maxNotePos + 1;
        }

        if (!this.isDeleted) {
            this.isDeleted = false;
        }

        this.dateModified = dateUtils.nowDate()
    }
}

module.exports = Branch;
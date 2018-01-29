"use strict";

const express = require('express');
const router = express.Router();
const sql = require('../../services/sql');
const auth = require('../../services/auth');
const sync_table = require('../../services/sync_table');
const utils = require('../../services/utils');
const wrap = require('express-promise-wrap').wrap;

router.get('/:noteId/attributes', auth.checkApiAuth, wrap(async (req, res, next) => {
    const noteId = req.params.noteId;

    res.send(await sql.getAll("SELECT * FROM attributes WHERE noteId = ? ORDER BY dateCreated", [noteId]));
}));

router.put('/:noteId/attributes', auth.checkApiAuth, wrap(async (req, res, next) => {
    const noteId = req.params.noteId;
    const attributes = req.body;
    const now = utils.nowDate();

    await sql.doInTransaction(async () => {
        for (const attr of attributes) {
            if (attr.attributeId) {
                await sql.execute("UPDATE attributes SET name = ?, value = ?, dateModified = ? WHERE attributeId = ?",
                    [attr.name, attr.value, now, attr.attributeId]);
            }
            else {
                attr.attributeId = utils.newAttributeId();

                await sql.insert("attributes", {
                   attributeId: attr.attributeId,
                   noteId: noteId,
                   name: attr.name,
                   value: attr.value,
                   dateCreated: now,
                   dateModified: now
                });
            }

            await sync_table.addAttributeSync(attr.attributeId);
        }
    });

    res.send(await sql.getAll("SELECT * FROM attributes WHERE noteId = ? ORDER BY dateCreated", [noteId]));
}));

module.exports = router;
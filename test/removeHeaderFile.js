/**
    Licensed to the Apache Software Foundation (ASF) under one
    or more contributor license agreements.  See the NOTICE file
    distributed with this work for additional information
    regarding copyright ownership.  The ASF licenses this file
    to you under the Apache License, Version 2.0 (the
    "License"); you may not use this file except in compliance
    with the License.  You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, either express or implied.  See the License for the
    specific language governing permissions and limitations
    under the License.
*/
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');

const fullProject = require('./fixtures/full-project');
const fullProjectStr = JSON.stringify(fullProject);
const pbx = require('../lib/pbxProject');
const pbxFile = require('../lib/pbxFile');
const proj = new pbx('.');

function cleanHash () {
    return JSON.parse(fullProjectStr);
}

describe('removeHeaderFile', () => {
    beforeEach(() => {
        proj.hash = cleanHash();
    });

    it('should return a pbxFile', () => {
        const newFile = proj.addHeaderFile('file.h');

        assert.equal(newFile.constructor, pbxFile);

        const deletedFile = proj.removeHeaderFile('file.h');

        assert.equal(deletedFile.constructor, pbxFile);
    });

    it('should set a fileRef on the pbxFile', () => {
        const newFile = proj.addHeaderFile('file.h');

        assert.ok(newFile.fileRef);

        const deletedFile = proj.removeHeaderFile('file.h');

        assert.ok(deletedFile.fileRef);
    });

    it('should remove 2 fields from the PBXFileReference section', () => {
        const newFile = proj.addHeaderFile('file.h');
        var fileRefSection = proj.pbxFileReferenceSection();
        var frsLength = Object.keys(fileRefSection).length;

        assert.equal(68, frsLength);
        assert.ok(fileRefSection[newFile.fileRef]);
        assert.ok(fileRefSection[newFile.fileRef + '_comment']);

        const deletedFile = proj.removeHeaderFile('file.h');
        var fileRefSection = proj.pbxFileReferenceSection();
        var frsLength = Object.keys(fileRefSection).length;

        assert.equal(66, frsLength);
        assert.ok(!fileRefSection[deletedFile.fileRef]);
        assert.ok(!fileRefSection[deletedFile.fileRef + '_comment']);
    });

    it('should remove comment from the PBXFileReference correctly', () => {
        const newFile = proj.addHeaderFile('file.h');
        var fileRefSection = proj.pbxFileReferenceSection();
        var commentKey = newFile.fileRef + '_comment';

        assert.equal(fileRefSection[commentKey], 'file.h');

        const deletedFile = proj.removeHeaderFile('file.h');
        var fileRefSection = proj.pbxFileReferenceSection();
        var commentKey = deletedFile.fileRef + '_comment';
        assert.ok(!fileRefSection[commentKey]);
    });

    it('should remove the PBXFileReference object correctly', () => {
        const newFile = proj.addHeaderFile('Plugins/file.h');
        var fileRefSection = proj.pbxFileReferenceSection();
        var fileRefEntry = fileRefSection[newFile.fileRef];

        assert.equal(fileRefEntry.isa, 'PBXFileReference');
        assert.equal(fileRefEntry.fileEncoding, 4);
        assert.equal(fileRefEntry.lastKnownFileType, 'sourcecode.c.h');
        assert.equal(fileRefEntry.name, '"file.h"');
        assert.equal(fileRefEntry.path, '"file.h"');
        assert.equal(fileRefEntry.sourceTree, '"<group>"');

        const deletedFile = proj.removeHeaderFile('Plugins/file.h');
        var fileRefSection = proj.pbxFileReferenceSection();
        var fileRefEntry = fileRefSection[deletedFile.fileRef];

        assert.ok(!fileRefEntry);
    });

    it('should remove from the Plugins PBXGroup group', () => {
        const newFile = proj.addHeaderFile('Plugins/file.h');
        var plugins = proj.pbxGroupByName('Plugins');

        assert.equal(plugins.children.length, 1);

        const deletedFile = proj.removeHeaderFile('Plugins/file.h');
        var plugins = proj.pbxGroupByName('Plugins');

        assert.equal(plugins.children.length, 0);
    });
});

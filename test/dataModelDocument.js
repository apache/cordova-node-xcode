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

const jsonProject = require('./fixtures/full-project');
const fullProjectStr = JSON.stringify(jsonProject);
const path = require('path');
const PBXProject = require('../lib/pbxProject');
const PBXFile = require('../lib/pbxFile');
const proj = new PBXProject('.');
const singleDataModelFilePath = __dirname + '/fixtures/single-data-model.xcdatamodeld';
const multipleDataModelFilePath = __dirname + '/fixtures/multiple-data-model.xcdatamodeld';

function cleanHash () {
    return JSON.parse(fullProjectStr);
}

describe('dataModelDocument', () => {
    beforeEach(() => {
        proj.hash = cleanHash();
    });

    it('should return a pbxFile', () => {
        const newFile = proj.addDataModelDocument(singleDataModelFilePath);

        assert.equal(newFile.constructor, PBXFile);
    });

    it('should set a uuid on the pbxFile', () => {
        const newFile = proj.addDataModelDocument(singleDataModelFilePath);

        assert.ok(newFile.uuid);
    });

    it('should set a fileRef on the pbxFile', () => {
        const newFile = proj.addDataModelDocument(singleDataModelFilePath);

        assert.ok(newFile.fileRef);
    });

    it('should set an optional target on the pbxFile', () => {
        const newFile = proj.addDataModelDocument(singleDataModelFilePath, undefined, { target });
        var target = proj.findTargetKey('TestApp');

        assert.equal(newFile.target, target);
    });

    it('should populate the PBXBuildFile section with 2 fields', () => {
        const newFile = proj.addDataModelDocument(singleDataModelFilePath);
        const buildFileSection = proj.pbxBuildFileSection();
        const bfsLength = Object.keys(buildFileSection).length;

        assert.equal(59 + 1, bfsLength);
        assert.ok(buildFileSection[newFile.uuid]);
        assert.ok(buildFileSection[newFile.uuid + '_comment']);
    });

    it('should populate the PBXFileReference section with 2 fields for single model document', () => {
        const newFile = proj.addDataModelDocument(singleDataModelFilePath);
        const fileRefSection = proj.pbxFileReferenceSection();
        const frsLength = Object.keys(fileRefSection).length;

        assert.equal(66 + 2, frsLength);
        assert.ok(fileRefSection[newFile.models[0].fileRef]);
        assert.ok(fileRefSection[newFile.models[0].fileRef + '_comment']);
    });

    it('should populate the PBXFileReference section with 2 fields for each model of a model document', () => {
        const newFile = proj.addDataModelDocument(multipleDataModelFilePath);
        const fileRefSection = proj.pbxFileReferenceSection();
        const frsLength = Object.keys(fileRefSection).length;

        assert.equal(66 + 2 * 2, frsLength);
        assert.ok(fileRefSection[newFile.models[0].fileRef]);
        assert.ok(fileRefSection[newFile.models[0].fileRef + '_comment']);
        assert.ok(fileRefSection[newFile.models[1].fileRef]);
        assert.ok(fileRefSection[newFile.models[1].fileRef + '_comment']);
    });

    it('should add to resources group by default', () => {
        const newFile = proj.addDataModelDocument(singleDataModelFilePath);
        groupChildren = proj.pbxGroupByName('Resources').children,
        found = false;

        for (const index in groupChildren) {
            if (groupChildren[index].comment === 'single-data-model.xcdatamodeld') {
                found = true;
                break;
            }
        }
        assert.ok(found);
    });

    it('should add to group specified by key', () => {
        const group = 'Frameworks';
        const newFile = proj.addDataModelDocument(singleDataModelFilePath, proj.findPBXGroupKey({ name: group }));
        groupChildren = proj.pbxGroupByName(group).children;

        let found = false;
        for (const index in groupChildren) {
            if (groupChildren[index].comment === path.basename(singleDataModelFilePath)) {
                found = true;
                break;
            }
        }
        assert.ok(found);
    });

    it('should add to group specified by name', () => {
        const group = 'Frameworks';
        const newFile = proj.addDataModelDocument(singleDataModelFilePath, group);
        groupChildren = proj.pbxGroupByName(group).children;

        let found = false;
        for (const index in groupChildren) {
            if (groupChildren[index].comment === path.basename(singleDataModelFilePath)) {
                found = true;
                break;
            }
        }
        assert.ok(found);
    });

    it('should add to the PBXSourcesBuildPhase', () => {
        const newFile = proj.addDataModelDocument(singleDataModelFilePath);
        const sources = proj.pbxSourcesBuildPhaseObj();

        assert.equal(sources.files.length, 2 + 1);
    });

    it('should create a XCVersionGroup section', () => {
        const newFile = proj.addDataModelDocument(singleDataModelFilePath);
        const xcVersionGroupSection = proj.xcVersionGroupSection();

        assert.ok(xcVersionGroupSection[newFile.fileRef]);
    });

    it('should populate the XCVersionGroup comment correctly', () => {
        const newFile = proj.addDataModelDocument(singleDataModelFilePath);
        const xcVersionGroupSection = proj.xcVersionGroupSection();
        const commentKey = newFile.fileRef + '_comment';

        assert.equal(xcVersionGroupSection[commentKey], path.basename(singleDataModelFilePath));
    });

    it('should add the XCVersionGroup object correctly', () => {
        const newFile = proj.addDataModelDocument(singleDataModelFilePath);
        const xcVersionGroupSection = proj.xcVersionGroupSection();
        const xcVersionGroupEntry = xcVersionGroupSection[newFile.fileRef];

        assert.equal(xcVersionGroupEntry.isa, 'XCVersionGroup');
        assert.equal(xcVersionGroupEntry.children[0], newFile.models[0].fileRef);
        assert.equal(xcVersionGroupEntry.currentVersion, newFile.currentModel.fileRef);
        assert.equal(xcVersionGroupEntry.name, path.basename(singleDataModelFilePath));
        // Need to validate against normalized path, since paths should contain forward slash on OSX
        assert.equal(xcVersionGroupEntry.path, singleDataModelFilePath.replace(/\\/g, '/'));
        assert.equal(xcVersionGroupEntry.sourceTree, '"<group>"');
        assert.equal(xcVersionGroupEntry.versionGroupType, 'wrapper.xcdatamodel');
    });
});

/**
 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements.  See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership.  The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 'License'); you may not use this file except in compliance
 with the License.  You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
 */

const jsonProject = require('./fixtures/full-project');
const fullProjectStr = JSON.stringify(jsonProject);
const path = require('path');
const pbx = require('../lib/pbxProject');
const pbxFile = require('../lib/pbxFile');
const proj = new pbx('.');
const singleDataModelFilePath =
        __dirname + '/fixtures/single-data-model.xcdatamodeld';
const multipleDataModelFilePath =
        __dirname + '/fixtures/multiple-data-model.xcdatamodeld';

function cleanHash () {
    return JSON.parse(fullProjectStr);
}

exports.setUp = function (callback) {
    proj.hash = cleanHash();
    callback();
};

exports.dataModelDocument = {
    'should return a pbxFile': function (test) {
        const newFile = proj.addDataModelDocument(singleDataModelFilePath);

        test.equal(newFile.constructor, pbxFile);
        test.done();
    },
    'should set a uuid on the pbxFile': function (test) {
        const newFile = proj.addDataModelDocument(singleDataModelFilePath);

        test.ok(newFile.uuid);
        test.done();
    },
    'should set a fileRef on the pbxFile': function (test) {
        const newFile = proj.addDataModelDocument(singleDataModelFilePath);

        test.ok(newFile.fileRef);
        test.done();
    },
    'should set an optional target on the pbxFile': function (test) {
        const target = proj.findTargetKey('TestApp');

        const newFile = proj.addDataModelDocument(
            singleDataModelFilePath,
            undefined,
            { target: target }
        );

        test.equal(newFile.target, target);
        test.done();
    },
    'should populate the PBXBuildFile section with 2 fields': function (test) {
        const newFile = proj.addDataModelDocument(singleDataModelFilePath);
        const buildFileSection = proj.pbxBuildFileSection();
        const bfsLength = Object.keys(buildFileSection).length;

        test.equal(59 + 1, bfsLength);
        test.ok(buildFileSection[newFile.uuid]);
        test.ok(buildFileSection[newFile.uuid + '_comment']);

        test.done();
    },
    'should populate the PBXFileReference section with 2 fields for single model document': function (
        test
    ) {
        const newFile = proj.addDataModelDocument(singleDataModelFilePath);
        const fileRefSection = proj.pbxFileReferenceSection();
        const frsLength = Object.keys(fileRefSection).length;

        test.equal(66 + 2, frsLength);
        test.ok(fileRefSection[newFile.models[0].fileRef]);
        test.ok(fileRefSection[newFile.models[0].fileRef + '_comment']);

        test.done();
    },
    'should populate the PBXFileReference section with 2 fields for each model of a model document': function (
        test
    ) {
        const newFile = proj.addDataModelDocument(multipleDataModelFilePath);
        const fileRefSection = proj.pbxFileReferenceSection();
        const frsLength = Object.keys(fileRefSection).length;

        test.equal(66 + 2 * 2, frsLength);
        test.ok(fileRefSection[newFile.models[0].fileRef]);
        test.ok(fileRefSection[newFile.models[0].fileRef + '_comment']);
        test.ok(fileRefSection[newFile.models[1].fileRef]);
        test.ok(fileRefSection[newFile.models[1].fileRef + '_comment']);

        test.done();
    },
    'should add to resources group by default': function (test) {
        const newFile = proj.addDataModelDocument(singleDataModelFilePath);
        (groupChildren = proj.pbxGroupByName('Resources').children),
        (found = false);

        for (const index in groupChildren) {
            if (
                groupChildren[index].comment ===
                'single-data-model.xcdatamodeld'
            ) {
                found = true;
                break;
            }
        }
        test.ok(found);
        test.done();
    },
    'should add to group specified by key': function (test) {
        const group = 'Frameworks';
        const newFile = proj.addDataModelDocument(
            singleDataModelFilePath,
            proj.findPBXGroupKey({ name: group })
        );
        groupChildren = proj.pbxGroupByName(group).children;

        let found = false;
        for (const index in groupChildren) {
            if (
                groupChildren[index].comment ===
                path.basename(singleDataModelFilePath)
            ) {
                found = true;
                break;
            }
        }
        test.ok(found);
        test.done();
    },
    'should add to group specified by name': function (test) {
        const group = 'Frameworks';
        const newFile = proj.addDataModelDocument(
            singleDataModelFilePath,
            group
        );
        groupChildren = proj.pbxGroupByName(group).children;

        let found = false;
        for (const index in groupChildren) {
            if (
                groupChildren[index].comment ===
                path.basename(singleDataModelFilePath)
            ) {
                found = true;
                break;
            }
        }
        test.ok(found);
        test.done();
    },
    'should add to the PBXSourcesBuildPhase': function (test) {
        const newFile = proj.addDataModelDocument(singleDataModelFilePath);
        const sources = proj.pbxSourcesBuildPhaseObj();

        test.equal(sources.files.length, 2 + 1);
        test.done();
    },
    'should create a XCVersionGroup section': function (test) {
        const newFile = proj.addDataModelDocument(singleDataModelFilePath);
        const xcVersionGroupSection = proj.xcVersionGroupSection();

        test.ok(xcVersionGroupSection[newFile.fileRef]);
        test.done();
    },
    'should populate the XCVersionGroup comment correctly': function (test) {
        const newFile = proj.addDataModelDocument(singleDataModelFilePath);
        const xcVersionGroupSection = proj.xcVersionGroupSection();
        const commentKey = newFile.fileRef + '_comment';

        test.equal(
            xcVersionGroupSection[commentKey],
            path.basename(singleDataModelFilePath)
        );
        test.done();
    },
    'should add the XCVersionGroup object correctly': function (test) {
        const newFile = proj.addDataModelDocument(singleDataModelFilePath);
        const xcVersionGroupSection = proj.xcVersionGroupSection();
        const xcVersionGroupEntry = xcVersionGroupSection[newFile.fileRef];

        test.equal(xcVersionGroupEntry.isa, 'XCVersionGroup');
        test.equal(
            xcVersionGroupEntry.children[0],
            newFile.models[0].fileRef
        );
        test.equal(
            xcVersionGroupEntry.currentVersion,
            newFile.currentModel.fileRef
        );
        test.equal(
            xcVersionGroupEntry.name,
            path.basename(singleDataModelFilePath)
        );
        // Need to validate against normalized path, since paths should contain forward slash on OSX
        test.equal(
            xcVersionGroupEntry.path,
            singleDataModelFilePath.replace(/\\/g, '/')
        );
        test.equal(xcVersionGroupEntry.sourceTree, '"<group>"');
        test.equal(
            xcVersionGroupEntry.versionGroupType,
            'wrapper.xcdatamodel'
        );

        test.done();
    }
};

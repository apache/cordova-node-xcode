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

const fullProject = require('./fixtures/full-project');
const fullProjectStr = JSON.stringify(fullProject);
const pbx = require('../lib/pbxProject');
const proj = new pbx('.');

function cleanHash () {
    return JSON.parse(fullProjectStr);
}

exports.setUp = function (callback) {
    proj.hash = cleanHash();
    callback();
};

exports.addBuildPhase = {
    'should return a pbxBuildPhase': function (test) {
        const buildPhase = proj.addBuildPhase(
            ['file.m'],
            'PBXSourcesBuildPhase',
            'My build phase'
        );

        test.ok(typeof buildPhase === 'object');
        test.done();
    },
    'should set a uuid on the pbxBuildPhase': function (test) {
        const buildPhase = proj.addBuildPhase(
            ['file.m'],
            'PBXSourcesBuildPhase',
            'My build phase'
        );

        test.ok(buildPhase.uuid);
        test.done();
    },
    'should add all files to build phase': function (test) {
        const buildPhase = proj.addBuildPhase(
            ['file.m', 'assets.bundle'],
            'PBXResourcesBuildPhase',
            'My build phase'
        ).buildPhase;
        for (let index = 0; index < buildPhase.files.length; index++) {
            const file = buildPhase.files[index];
            test.ok(file.value);
        }

        test.done();
    },
    'should add the PBXBuildPhase object correctly': function (test) {
        const buildPhase = proj.addBuildPhase(
            ['file.m', 'assets.bundle'],
            'PBXResourcesBuildPhase',
            'My build phase'
        ).buildPhase;
        const buildPhaseInPbx = proj.buildPhaseObject(
            'PBXResourcesBuildPhase',
            'My build phase'
        );

        test.equal(buildPhaseInPbx, buildPhase);
        test.equal(buildPhaseInPbx.isa, 'PBXResourcesBuildPhase');
        test.equal(buildPhaseInPbx.buildActionMask, 2147483647);
        test.equal(buildPhaseInPbx.runOnlyForDeploymentPostprocessing, 0);
        test.done();
    },
    'should add each of the files to PBXBuildFile section': function (test) {
        const buildPhase = proj.addBuildPhase(
            ['file.m', 'assets.bundle'],
            'PBXResourcesBuildPhase',
            'My build phase'
        ).buildPhase;
        const buildFileSection = proj.pbxBuildFileSection();

        for (let index = 0; index < buildPhase.files.length; index++) {
            const file = buildPhase.files[index];
            test.ok(buildFileSection[file.value]);
        }

        test.done();
    },
    'should add each of the files to PBXFileReference section': function (
        test
    ) {
        const buildPhase = proj.addBuildPhase(
            ['file.m', 'assets.bundle'],
            'PBXResourcesBuildPhase',
            'My build phase'
        ).buildPhase;
        const fileRefSection = proj.pbxFileReferenceSection();
        const buildFileSection = proj.pbxBuildFileSection();
        const fileRefs = [];

        for (let index = 0; index < buildPhase.files.length; index++) {
            const file = buildPhase.files[index];
            const fileRef = buildFileSection[file.value].fileRef;

            test.ok(fileRefSection[fileRef]);
        }

        test.done();
    },
    'should not add files to PBXFileReference section if already added': function (
        test
    ) {
        const fileRefSection = proj.pbxFileReferenceSection();
        const initialFileReferenceSectionItemsCount = Object.keys(
            fileRefSection
        );
        const buildPhase = proj.addBuildPhase(
            ['AppDelegate.m', 'main.m'],
            'PBXResourcesBuildPhase',
            'My build phase'
        ).buildPhase;
        const afterAdditionBuildFileSectionItemsCount = Object.keys(
            fileRefSection
        );

        test.deepEqual(
            initialFileReferenceSectionItemsCount,
            afterAdditionBuildFileSectionItemsCount
        );
        test.done();
    },
    'should not add files to PBXBuildFile section if already added': function (
        test
    ) {
        const buildFileSection = proj.pbxBuildFileSection();
        const initialBuildFileSectionItemsCount = Object.keys(buildFileSection);
        const buildPhase = proj.addBuildPhase(
            ['AppDelegate.m', 'main.m'],
            'PBXResourcesBuildPhase',
            'My build phase'
        ).buildPhase;
        const afterAdditionBuildFileSectionItemsCount = Object.keys(
            buildFileSection
        );

        test.deepEqual(
            initialBuildFileSectionItemsCount,
            afterAdditionBuildFileSectionItemsCount
        );
        test.done();
    },
    'should add only missing files to PBXFileReference section': function (
        test
    ) {
        const fileRefSection = proj.pbxFileReferenceSection();
        const buildFileSection = proj.pbxBuildFileSection();
        const initialFileReferenceSectionItemsCount = Object.keys(
            fileRefSection
        );
        const buildPhase = proj.addBuildPhase(
            ['file.m', 'AppDelegate.m'],
            'PBXResourcesBuildPhase',
            'My build phase'
        ).buildPhase;
        const afterAdditionBuildFileSectionItemsCount = Object.keys(
            fileRefSection
        );

        for (let index = 0; index < buildPhase.files.length; index++) {
            const file = buildPhase.files[index];
            const fileRef = buildFileSection[file.value].fileRef;

            test.ok(fileRefSection[fileRef]);
        }

        test.deepEqual(
            initialFileReferenceSectionItemsCount.length,
            afterAdditionBuildFileSectionItemsCount.length - 2
        );
        test.done();
    },
    "should set target to Frameworks given 'frameworks' as target": function (
        test
    ) {
        const buildPhase = proj.addBuildPhase(
            ['file.m'],
            'PBXCopyFilesBuildPhase',
            'Copy Files',
            proj.getFirstTarget().uuid,
            'frameworks'
        ).buildPhase;
        test.equal(buildPhase.dstSubfolderSpec, 10);
        test.done();
    },
    'should add a script build phase to echo "hello world!"': function (test) {
        const options = {
            shellPath: '/bin/sh',
            shellScript: 'echo "hello world!"'
        };
        const buildPhase = proj.addBuildPhase(
            [],
            'PBXShellScriptBuildPhase',
            'Run a script',
            proj.getFirstTarget().uuid,
            options
        ).buildPhase;
        test.equal(buildPhase.shellPath, '/bin/sh');
        test.equal(buildPhase.shellScript, '"echo \\"hello world!\\""');
        test.done();
    }
};

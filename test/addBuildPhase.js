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

var fullProject = require('./fixtures/full-project')
    fullProjectStr = JSON.stringify(fullProject),
    pbx = require('../lib/pbxProject'),
    proj = new pbx('.');

function cleanHash() {
    return JSON.parse(fullProjectStr);
}

exports.setUp = function (callback) {
    proj.hash = cleanHash();
    callback();
}

exports.addBuildPhase = {
    'should return a pbxBuildPhase': function (test) {
        var buildPhase = proj.addBuildPhase(['file.m'], 'PBXSourcesBuildPhase', 'My build phase');

        test.ok(typeof buildPhase === 'object');
        test.done()
    },
    'should set a uuid on the pbxBuildPhase': function (test) {
        var buildPhase = proj.addBuildPhase(['file.m'], 'PBXSourcesBuildPhase', 'My build phase');

        test.ok(buildPhase.uuid);
        test.done()
    },
    'should add all files to build phase': function (test) {
        var buildPhase = proj.addBuildPhase(['file.m', 'assets.bundle'], 'PBXResourcesBuildPhase', 'My build phase').buildPhase;
        for (var index = 0; index < buildPhase.files.length; index++) {
            var file = buildPhase.files[index];
            test.ok(file.value);
        }

        test.done()
    },
    'should add the PBXBuildPhase object correctly': function (test) {
        var buildPhase = proj.addBuildPhase(['file.m', 'assets.bundle'], 'PBXResourcesBuildPhase', 'My build phase').buildPhase,
            buildPhaseInPbx = proj.buildPhaseObject('PBXResourcesBuildPhase', 'My build phase');

        test.equal(buildPhaseInPbx, buildPhase);
        test.equal(buildPhaseInPbx.isa, 'PBXResourcesBuildPhase');
        test.equal(buildPhaseInPbx.buildActionMask, 2147483647);
        test.equal(buildPhaseInPbx.runOnlyForDeploymentPostprocessing, 0);
        test.done();
    },
    'should add each of the files to PBXBuildFile section': function (test) {
        var buildPhase = proj.addBuildPhase(['file.m', 'assets.bundle'], 'PBXResourcesBuildPhase', 'My build phase').buildPhase,
            buildFileSection = proj.pbxBuildFileSection();

        for (var index = 0; index < buildPhase.files.length; index++) {
            var file = buildPhase.files[index];
            test.ok(buildFileSection[file.value]);
        }

        test.done();
    },
    'should add each of the files to PBXFileReference section': function (test) {
        var buildPhase = proj.addBuildPhase(['file.m', 'assets.bundle'], 'PBXResourcesBuildPhase', 'My build phase').buildPhase,
            fileRefSection = proj.pbxFileReferenceSection(),
            buildFileSection = proj.pbxBuildFileSection(),
            fileRefs = [];

        for (var index = 0; index < buildPhase.files.length; index++) {
            var file = buildPhase.files[index],
                fileRef = buildFileSection[file.value].fileRef;

            test.ok(fileRefSection[fileRef]);
        }

        test.done();
    },
    'should not add files to PBXFileReference section if already added': function (test) {
        var fileRefSection = proj.pbxFileReferenceSection(),
            initialFileReferenceSectionItemsCount = Object.keys(fileRefSection),
            buildPhase = proj.addBuildPhase(['AppDelegate.m', 'main.m'], 'PBXResourcesBuildPhase', 'My build phase').buildPhase,
            afterAdditionBuildFileSectionItemsCount = Object.keys(fileRefSection);

        test.deepEqual(initialFileReferenceSectionItemsCount, afterAdditionBuildFileSectionItemsCount);
        test.done();
    },
    'should not add files to PBXBuildFile section if already added': function (test) {
        var buildFileSection  = proj.pbxBuildFileSection(),
            initialBuildFileSectionItemsCount  = Object.keys(buildFileSection),
            buildPhase = proj.addBuildPhase(['AppDelegate.m', 'main.m'], 'PBXResourcesBuildPhase', 'My build phase').buildPhase,
            afterAdditionBuildFileSectionItemsCount = Object.keys(buildFileSection);

        test.deepEqual(initialBuildFileSectionItemsCount, afterAdditionBuildFileSectionItemsCount);
        test.done();
    },
    'should add only missing files to PBXFileReference section': function (test) {
        var fileRefSection = proj.pbxFileReferenceSection(),
            buildFileSection = proj.pbxBuildFileSection(),
            initialFileReferenceSectionItemsCount = Object.keys(fileRefSection),
            buildPhase = proj.addBuildPhase(['file.m', 'AppDelegate.m'], 'PBXResourcesBuildPhase', 'My build phase').buildPhase,
            afterAdditionBuildFileSectionItemsCount = Object.keys(fileRefSection);

        for (var index = 0; index < buildPhase.files.length; index++) {
            var file = buildPhase.files[index],
                fileRef = buildFileSection[file.value].fileRef;

            test.ok(fileRefSection[fileRef]);
        }

        test.deepEqual(initialFileReferenceSectionItemsCount.length, afterAdditionBuildFileSectionItemsCount.length - 2);
        test.done();
    },
    'should set target to Wrapper given \'application\' as target': function (test) {
        var buildPhase = proj.addBuildPhase(['file.m'], 'PBXCopyFilesBuildPhase', 'Copy Files', proj.getFirstTarget().uuid, 'application').buildPhase;
        test.equal(buildPhase.dstSubfolderSpec, 1);
        test.done();
    },
    'should set target to Plugins given \'app_extension\' as target': function (test) {
        var buildPhase = proj.addBuildPhase(['file.m'], 'PBXCopyFilesBuildPhase', 'Copy Files', proj.getFirstTarget().uuid, 'app_extension').buildPhase;
        test.equal(buildPhase.dstSubfolderSpec, 13);
        test.done();
    },
    'should set target to Wapper given \'bundle\' as target': function (test) {
        var buildPhase = proj.addBuildPhase(['file.m'], 'PBXCopyFilesBuildPhase', 'Copy Files', proj.getFirstTarget().uuid, 'bundle').buildPhase;
        test.equal(buildPhase.dstSubfolderSpec, 1);
        test.done();
    },
    'should set target to Wapper given \'command_line_tool\' as target': function (test) {
        var buildPhase = proj.addBuildPhase(['file.m'], 'PBXCopyFilesBuildPhase', 'Copy Files', proj.getFirstTarget().uuid, 'command_line_tool').buildPhase;
        test.equal(buildPhase.dstSubfolderSpec, 1);
        test.done();
    },
    'should set target to Products Directory given \'dynamic_library\' as target': function (test) {
        var buildPhase = proj.addBuildPhase(['file.m'], 'PBXCopyFilesBuildPhase', 'Copy Files', proj.getFirstTarget().uuid, 'dynamic_library').buildPhase;
        test.equal(buildPhase.dstSubfolderSpec, 16);
        test.done();
    },
    'should set target to Shared Framework given \'framework\' as target': function (test) {
        var buildPhase = proj.addBuildPhase(['file.m'], 'PBXCopyFilesBuildPhase', 'Copy Files', proj.getFirstTarget().uuid, 'framework').buildPhase;
        test.equal(buildPhase.dstSubfolderSpec, 11);
        test.done();
    },
    'should set target to Frameworks given \'frameworks\' as target': function (test) {
        var buildPhase = proj.addBuildPhase(['file.m'], 'PBXCopyFilesBuildPhase', 'Copy Files', proj.getFirstTarget().uuid, 'frameworks').buildPhase;
        test.equal(buildPhase.dstSubfolderSpec, 10);
        test.done();
    },
    'should set target to Products Directory given \'static_library\' as target': function (test) {
        var buildPhase = proj.addBuildPhase(['file.m'], 'PBXCopyFilesBuildPhase', 'Copy Files', proj.getFirstTarget().uuid, 'static_library').buildPhase;
        test.equal(buildPhase.dstSubfolderSpec, 16);
        test.done();
    },
    'should set target to Wrapper given \'unit_test_bundle\' as target': function (test) {
        var buildPhase = proj.addBuildPhase(['file.m'], 'PBXCopyFilesBuildPhase', 'Copy Files', proj.getFirstTarget().uuid, 'unit_test_bundle').buildPhase;
        test.equal(buildPhase.dstSubfolderSpec, 1);
        test.done();
    },
    'should set target to Wrapper given \'watch_app\' as target': function (test) {
        var buildPhase = proj.addBuildPhase(['file.m'], 'PBXCopyFilesBuildPhase', 'Copy Files', proj.getFirstTarget().uuid, 'watch_app').buildPhase;
        test.equal(buildPhase.dstSubfolderSpec, 1);
        test.done();
    },
    'should set target to Products Directory given \'watch2_app\' as target': function (test) {
        var buildPhase = proj.addBuildPhase(['file.m'], 'PBXCopyFilesBuildPhase', 'Copy Files', proj.getFirstTarget().uuid, 'watch2_app').buildPhase;
        test.equal(buildPhase.dstSubfolderSpec, 16);
        test.done();
    },
    'should set target to Plugins given \'watch_extension\' as target': function (test) {
        var buildPhase = proj.addBuildPhase(['file.m'], 'PBXCopyFilesBuildPhase', 'Copy Files', proj.getFirstTarget().uuid, 'watch_extension').buildPhase;
        test.equal(buildPhase.dstSubfolderSpec, 13);
        test.done();
    },
    'should set target to Plugins given \'watch2_extension\' as target': function (test) {
        var buildPhase = proj.addBuildPhase(['file.m'], 'PBXCopyFilesBuildPhase', 'Copy Files', proj.getFirstTarget().uuid, 'watch2_extension').buildPhase;
        test.equal(buildPhase.dstSubfolderSpec, 13);
        test.done();
    },
    'should add a script build phase to echo "hello world!"': function(test) {
        var options = {shellPath: '/bin/sh', shellScript: 'echo "hello world!"'};
        var buildPhase = proj.addBuildPhase([], 'PBXShellScriptBuildPhase', 'Run a script', proj.getFirstTarget().uuid, options).buildPhase;
        test.equal(buildPhase.shellPath, '/bin/sh');
        test.equal(buildPhase.shellScript, '"echo \\"hello world!\\""');
        test.done();
    },
    'should add runOnlyForDeploymentPostprocessing option to run scripts': function (test) {
        var options = {shellPath: '/bin/sh', shellScript: 'echo "hello world!"', runOnlyForDeploymentPostprocessing: 1};
        var buildPhase = proj.addBuildPhase([], 'PBXShellScriptBuildPhase', 'Run a script', proj.getFirstTarget().uuid, options).buildPhase;

        test.equal(buildPhase.runOnlyForDeploymentPostprocessing, 1);
        test.done();
    }
}

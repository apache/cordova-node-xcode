/*
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
const PBXProject = require('../lib/pbxProject');
const proj = new PBXProject('.');

function cleanHash () {
    return JSON.parse(fullProjectStr);
}

describe('addBuildPhase', () => {
    beforeEach(() => {
        proj.hash = cleanHash();
    });

    it('should return a pbxBuildPhase', () => {
        const buildPhase = proj.addBuildPhase(['file.m'], 'PBXSourcesBuildPhase', 'My build phase');
        assert.ok(typeof buildPhase === 'object');
    });

    it('should set a uuid on the pbxBuildPhase', () => {
        const buildPhase = proj.addBuildPhase(['file.m'], 'PBXSourcesBuildPhase', 'My build phase');
        assert.ok(buildPhase.uuid);
    });

    it('should add all files to build phase', () => {
        const buildPhase = proj.addBuildPhase(['file.m', 'assets.bundle'], 'PBXResourcesBuildPhase', 'My build phase').buildPhase;
        for (let index = 0; index < buildPhase.files.length; index++) {
            const file = buildPhase.files[index];
            assert.ok(file.value);
        }
    });

    it('should add the PBXBuildPhase object correctly', () => {
        const buildPhase = proj.addBuildPhase(['file.m', 'assets.bundle'], 'PBXResourcesBuildPhase', 'My build phase').buildPhase;
        const buildPhaseInPbx = proj.buildPhaseObject('PBXResourcesBuildPhase', 'My build phase');

        assert.equal(buildPhaseInPbx, buildPhase);
        assert.equal(buildPhaseInPbx.isa, 'PBXResourcesBuildPhase');
        assert.equal(buildPhaseInPbx.buildActionMask, 2147483647);
        assert.equal(buildPhaseInPbx.runOnlyForDeploymentPostprocessing, 0);
    });

    it('should add each of the files to PBXBuildFile section', () => {
        const buildPhase = proj.addBuildPhase(['file.m', 'assets.bundle'], 'PBXResourcesBuildPhase', 'My build phase').buildPhase;
        const buildFileSection = proj.pbxBuildFileSection();

        for (let index = 0; index < buildPhase.files.length; index++) {
            const file = buildPhase.files[index];
            assert.ok(buildFileSection[file.value]);
        }
    });

    it('should add each of the files to PBXFileReference section', () => {
        const buildPhase = proj.addBuildPhase(['file.m', 'assets.bundle'], 'PBXResourcesBuildPhase', 'My build phase').buildPhase;
        const fileRefSection = proj.pbxFileReferenceSection();
        const buildFileSection = proj.pbxBuildFileSection();

        for (let index = 0; index < buildPhase.files.length; index++) {
            const file = buildPhase.files[index];
            const fileRef = buildFileSection[file.value].fileRef;

            assert.ok(fileRefSection[fileRef]);
        }
    });

    it('should not add files to PBXFileReference section if already added', () => {
        const fileRefSection = proj.pbxFileReferenceSection();
        const initialFileReferenceSectionItemsCount = Object.keys(fileRefSection);
        proj.addBuildPhase(['AppDelegate.m', 'main.m'], 'PBXResourcesBuildPhase', 'My build phase');
        const afterAdditionBuildFileSectionItemsCount = Object.keys(fileRefSection);

        assert.deepEqual(initialFileReferenceSectionItemsCount, afterAdditionBuildFileSectionItemsCount);
    });

    it('should not add files to PBXBuildFile section if already added', () => {
        const buildFileSection = proj.pbxBuildFileSection();
        const initialBuildFileSectionItemsCount = Object.keys(buildFileSection);
        proj.addBuildPhase(['AppDelegate.m', 'main.m'], 'PBXResourcesBuildPhase', 'My build phase');
        const afterAdditionBuildFileSectionItemsCount = Object.keys(buildFileSection);

        assert.deepEqual(initialBuildFileSectionItemsCount, afterAdditionBuildFileSectionItemsCount);
    });

    it('should add only missing files to PBXFileReference section', () => {
        const fileRefSection = proj.pbxFileReferenceSection();
        const buildFileSection = proj.pbxBuildFileSection();
        const initialFileReferenceSectionItemsCount = Object.keys(fileRefSection);
        const buildPhase = proj.addBuildPhase(['file.m', 'AppDelegate.m'], 'PBXResourcesBuildPhase', 'My build phase').buildPhase;
        const afterAdditionBuildFileSectionItemsCount = Object.keys(fileRefSection);

        for (let index = 0; index < buildPhase.files.length; index++) {
            const file = buildPhase.files[index];
            const fileRef = buildFileSection[file.value].fileRef;

            assert.ok(fileRefSection[fileRef]);
        }

        assert.deepEqual(initialFileReferenceSectionItemsCount.length, afterAdditionBuildFileSectionItemsCount.length - 2);
    });

    it('should set target to Wrapper given \'application\' as target', () => {
        const buildPhase = proj.addBuildPhase(['file.m'], 'PBXCopyFilesBuildPhase', 'Copy Files', proj.getFirstTarget().uuid, 'application').buildPhase;
        assert.equal(buildPhase.dstSubfolderSpec, 1);
    });

    it('should set target to Plugins given \'app_extension\' as target', () => {
        const buildPhase = proj.addBuildPhase(['file.m'], 'PBXCopyFilesBuildPhase', 'Copy Files', proj.getFirstTarget().uuid, 'app_extension').buildPhase;
        assert.equal(buildPhase.dstSubfolderSpec, 13);
    });

    it('should set target to Wapper given \'bundle\' as target', () => {
        const buildPhase = proj.addBuildPhase(['file.m'], 'PBXCopyFilesBuildPhase', 'Copy Files', proj.getFirstTarget().uuid, 'bundle').buildPhase;
        assert.equal(buildPhase.dstSubfolderSpec, 1);
    });

    it('should set target to Wapper given \'command_line_tool\' as target', () => {
        const buildPhase = proj.addBuildPhase(['file.m'], 'PBXCopyFilesBuildPhase', 'Copy Files', proj.getFirstTarget().uuid, 'command_line_tool').buildPhase;
        assert.equal(buildPhase.dstSubfolderSpec, 1);
    });

    it('should set target to Products Directory given \'dynamic_library\' as target', () => {
        const buildPhase = proj.addBuildPhase(['file.m'], 'PBXCopyFilesBuildPhase', 'Copy Files', proj.getFirstTarget().uuid, 'dynamic_library').buildPhase;
        assert.equal(buildPhase.dstSubfolderSpec, 16);
    });

    it('should set target to Shared Framework given \'framework\' as target', () => {
        const buildPhase = proj.addBuildPhase(['file.m'], 'PBXCopyFilesBuildPhase', 'Copy Files', proj.getFirstTarget().uuid, 'framework').buildPhase;
        assert.equal(buildPhase.dstSubfolderSpec, 11);
    });

    it('should set target to Frameworks given \'frameworks\' as target', () => {
        const buildPhase = proj.addBuildPhase(['file.m'], 'PBXCopyFilesBuildPhase', 'Copy Files', proj.getFirstTarget().uuid, 'frameworks').buildPhase;
        assert.equal(buildPhase.dstSubfolderSpec, 10);
    });

    it('should set target to Products Directory given \'static_library\' as target', () => {
        const buildPhase = proj.addBuildPhase(['file.m'], 'PBXCopyFilesBuildPhase', 'Copy Files', proj.getFirstTarget().uuid, 'static_library').buildPhase;
        assert.equal(buildPhase.dstSubfolderSpec, 16);
    });

    it('should set target to Wrapper given \'unit_test_bundle\' as target', () => {
        const buildPhase = proj.addBuildPhase(['file.m'], 'PBXCopyFilesBuildPhase', 'Copy Files', proj.getFirstTarget().uuid, 'unit_test_bundle').buildPhase;
        assert.equal(buildPhase.dstSubfolderSpec, 1);
    });

    it('should set target to Wrapper given \'watch_app\' as target', () => {
        const buildPhase = proj.addBuildPhase(['file.m'], 'PBXCopyFilesBuildPhase', 'Copy Files', proj.getFirstTarget().uuid, 'watch_app').buildPhase;
        assert.equal(buildPhase.dstSubfolderSpec, 1);
    });

    it('should set target to Products Directory given \'watch2_app\' as target', () => {
        const buildPhase = proj.addBuildPhase(['file.m'], 'PBXCopyFilesBuildPhase', 'Copy Files', proj.getFirstTarget().uuid, 'watch2_app').buildPhase;
        assert.equal(buildPhase.dstSubfolderSpec, 16);
    });

    it('should set target to Plugins given \'watch_extension\' as target', () => {
        const buildPhase = proj.addBuildPhase(['file.m'], 'PBXCopyFilesBuildPhase', 'Copy Files', proj.getFirstTarget().uuid, 'watch_extension').buildPhase;
        assert.equal(buildPhase.dstSubfolderSpec, 13);
    });

    it('should set target to Plugins given \'watch2_extension\' as target', () => {
        const buildPhase = proj.addBuildPhase(['file.m'], 'PBXCopyFilesBuildPhase', 'Copy Files', proj.getFirstTarget().uuid, 'watch2_extension').buildPhase;
        assert.equal(buildPhase.dstSubfolderSpec, 13);
    });

    it('should add a script build phase to echo "hello world!"', () => {
        const options = { shellPath: '/bin/sh', shellScript: 'echo "hello world!"' };
        const buildPhase = proj.addBuildPhase([], 'PBXShellScriptBuildPhase', 'Run a script', proj.getFirstTarget().uuid, options).buildPhase;
        assert.equal(buildPhase.shellPath, '/bin/sh');
        assert.equal(buildPhase.shellScript, '"echo \\"hello world!\\""');
    });

    it('should add runOnlyForDeploymentPostprocessing option to run scripts', () => {
        const options = { shellPath: '/bin/sh', shellScript: 'echo "hello world!"', runOnlyForDeploymentPostprocessing: 1 };
        const buildPhase = proj.addBuildPhase([], 'PBXShellScriptBuildPhase', 'Run a script', proj.getFirstTarget().uuid, options).buildPhase;
        assert.equal(buildPhase.runOnlyForDeploymentPostprocessing, 1);
    });
});

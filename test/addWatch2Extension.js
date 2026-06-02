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
const PBXProject = require('../lib/pbxProject');
const PBXFile = require('../lib/pbxFile');
const proj = new PBXProject('.');

function cleanHash () {
    return JSON.parse(fullProjectStr);
}

const TARGET_NAME = 'TestWatchExtension';
const TARGET_TYPE = 'watch2_extension';
const TARGET_SUBFOLDER_NAME = 'TestWatchExtensionFiles';

describe('addWatchExtension', () => {
    beforeEach(() => {
        proj.hash = cleanHash();
    });
    it('should create a new watch2 extension target with the correct product type', () => {
        const target = proj.addTarget(TARGET_NAME, TARGET_TYPE, TARGET_SUBFOLDER_NAME);

        assert.ok(typeof target === 'object');
        assert.ok(target.uuid);
        assert.ok(target.pbxNativeTarget);
        assert.ok(target.pbxNativeTarget.isa);
        assert.ok(target.pbxNativeTarget.name);
        assert.ok(target.pbxNativeTarget.productName);
        assert.ok(target.pbxNativeTarget.productReference);
        assert.ok(target.pbxNativeTarget.productType);
        assert.ok(target.pbxNativeTarget.buildConfigurationList);
        assert.ok(target.pbxNativeTarget.buildPhases);
        assert.ok(target.pbxNativeTarget.buildRules);
        assert.ok(target.pbxNativeTarget.dependencies);
        assert.equal(target.pbxNativeTarget.productType, '"com.apple.product-type.watchkit2-extension"');
    });

    it('should create a new watch2 extension target and add source, framework, resource and header files and the corresponding build phases', () => {
        const target = proj.addTarget(TARGET_NAME, TARGET_TYPE, TARGET_SUBFOLDER_NAME);
        const options = { target: target.uuid };

        const sourceFile = proj.addSourceFile('Plugins/file.m', options);
        const sourcePhase = proj.addBuildPhase([], 'PBXSourcesBuildPhase', 'Sources', target.uuid);
        const resourceFile = proj.addResourceFile('assets.bundle', options);
        const resourcePhase = proj.addBuildPhase([], 'PBXResourcesBuildPhase', 'Resources', target.uuid);
        const frameworkFile = proj.addFramework('libsqlite3.dylib', options);
        const frameworkPhase = proj.addBuildPhase([], 'PBXFrameworkBuildPhase', 'Frameworks', target.uuid);
        const headerFile = proj.addHeaderFile('file.h', options);

        assert.ok(sourcePhase);
        assert.ok(resourcePhase);
        assert.ok(frameworkPhase);

        assert.equal(sourceFile.constructor, PBXFile);
        assert.equal(resourceFile.constructor, PBXFile);
        assert.equal(frameworkFile.constructor, PBXFile);
        assert.equal(headerFile.constructor, PBXFile);

        assert.ok(typeof target === 'object');
        assert.ok(target.uuid);
        assert.ok(target.pbxNativeTarget);
        assert.ok(target.pbxNativeTarget.isa);
        assert.ok(target.pbxNativeTarget.name);
        assert.ok(target.pbxNativeTarget.productName);
        assert.ok(target.pbxNativeTarget.productReference);
        assert.ok(target.pbxNativeTarget.productType);
        assert.ok(target.pbxNativeTarget.buildConfigurationList);
        assert.ok(target.pbxNativeTarget.buildPhases);
        assert.ok(target.pbxNativeTarget.buildRules);
        assert.ok(target.pbxNativeTarget.dependencies);
    });

    it('should not create a new watch2 extension build phase if no watch2 app exists', () => {
        const target = proj.addTarget(TARGET_NAME, TARGET_TYPE);

        assert.ok(typeof target === 'object');
        assert.ok(target.uuid);
        assert.ok(target.pbxNativeTarget);
        assert.ok(target.pbxNativeTarget.isa);
        assert.ok(target.pbxNativeTarget.name);
        assert.ok(target.pbxNativeTarget.productName);
        assert.ok(target.pbxNativeTarget.productReference);
        assert.ok(target.pbxNativeTarget.productType);
        assert.ok(target.pbxNativeTarget.buildConfigurationList);
        assert.ok(target.pbxNativeTarget.buildPhases);
        assert.ok(target.pbxNativeTarget.buildRules);
        assert.ok(target.pbxNativeTarget.dependencies);

        const buildPhase = proj.buildPhaseObject('PBXCopyFilesBuildPhase', 'Embed App Extensions', target.uuid);

        assert.ok(!buildPhase);
    });

    it('should create a new watch2 extension build phase if watch2 app exists', () => {
        proj.addTarget('TestWatchApp', 'watch2_app');
        const target = proj.addTarget(TARGET_NAME, TARGET_TYPE);

        const buildPhase = proj.buildPhaseObject('PBXCopyFilesBuildPhase', 'Embed App Extensions', target.uuid);

        assert.ok(buildPhase);
        assert.ok(buildPhase.files);
        assert.equal(buildPhase.files.length, 1);
        assert.ok(buildPhase.dstPath);
        assert.equal(buildPhase.dstSubfolderSpec, 13);
    });

    it('should create a new watch2 extension and add to existing watch2 app build phase and dependency', () => {
        const watchApp = proj.addTarget('TestWatchApp', 'watch2_app');

        const nativeTargets = proj.pbxNativeTargetSection();

        assert.equal(nativeTargets[watchApp.uuid].buildPhases.length, 0);
        assert.equal(nativeTargets[watchApp.uuid].dependencies.length, 0);

        proj.addTarget(TARGET_NAME, TARGET_TYPE);

        assert.equal(nativeTargets[watchApp.uuid].buildPhases.length, 1);
        assert.equal(nativeTargets[watchApp.uuid].dependencies.length, 1);
    });

    it('should not modify watch2 target unless adding watch2 extension', () => {
        const watchApp = proj.addTarget('TestWatchApp', 'watch2_app');

        const nativeTargets = proj.pbxNativeTargetSection();

        assert.equal(nativeTargets[watchApp.uuid].buildPhases.length, 0);
        assert.equal(nativeTargets[watchApp.uuid].dependencies.length, 0);

        proj.addTarget(TARGET_NAME, 'app_extension');

        assert.equal(nativeTargets[watchApp.uuid].buildPhases.length, 0);
        assert.equal(nativeTargets[watchApp.uuid].dependencies.length, 0);

        proj.addTarget(TARGET_NAME, 'watch_extension');

        assert.equal(nativeTargets[watchApp.uuid].buildPhases.length, 0);
        assert.equal(nativeTargets[watchApp.uuid].dependencies.length, 0);
    });

    it('should create a new watch2 extension with appropriate target extension', () => {
        proj.addTarget('TestWatchApp', 'watch2_app');
        const target = proj.addTarget(TARGET_NAME, TARGET_TYPE);

        const buildPhase = proj.buildPhaseObject('PBXCopyFilesBuildPhase', 'Embed App Extensions', target.uuid);

        const buildPhaseFile = buildPhase.files[0];
        assert.ok(buildPhaseFile.value);
        const buildPhaseFileSection = proj.pbxBuildFileSection()[buildPhaseFile.value];
        assert.ok(buildPhaseFileSection);
        assert.ok(buildPhaseFileSection.fileRef);

        const buildPhaseFileRef = proj.pbxFileReferenceSection()[buildPhaseFileSection.fileRef];
        assert.ok(buildPhaseFileRef);
        assert.ok(buildPhaseFileRef.name);
        assert.ok(buildPhaseFileRef.path);

        const quotedTargetPath = '"' + TARGET_NAME + '.appex"';
        assert.equal(buildPhaseFileRef.name, quotedTargetPath);
        assert.equal(buildPhaseFileRef.path, quotedTargetPath);
    });
});

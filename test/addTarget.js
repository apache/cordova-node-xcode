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
const PBXFile = require('../lib/pbxFile');
const proj = new PBXProject('.');

function cleanHash () {
    return JSON.parse(fullProjectStr);
}

const TARGET_NAME = 'TestExtension';
const TARGET_TYPE = 'app_extension';
const TARGET_SUBFOLDER_NAME = 'TestExtensionFiles';
const TARGET_BUNDLE_ID = 'com.cordova.test.appextension';

describe('addTarget', () => {
    beforeEach(() => {
        proj.hash = cleanHash();
    });

    it('should throw when target name is missing', () => {
        assert.throws(function () {
            proj.addTarget(null, TARGET_TYPE);
        });
    });

    it('should throw when provided blank or empty target name', () => {
        assert.throws(function () {
            proj.addTarget('', TARGET_TYPE);
        }, function (error) {
            return (error instanceof Error) && /Target name missing/i.test(error);
        });

        assert.throws(function () {
            proj.addTarget('   ', TARGET_TYPE);
        }, function (error) {
            return (error instanceof Error) && /Target name missing/i.test(error);
        });
    });

    it('should throw when target type missing', () => {
        assert.throws(function () {
            proj.addTarget(TARGET_NAME, null);
        }, function (error) {
            return (error instanceof Error) && /Target type missing/i.test(error);
        });
    });

    it('should throw when invalid target type', () => {
        assert.throws(function () {
            proj.addTarget(TARGET_NAME, 'invalid_target_type');
        }, function (error) {
            return (error instanceof Error) && /Target type invalid/i.test(error);
        });
    });

    it('should create a new target', () => {
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
    });

    it('should create a new target with bundleid', () => {
        const target = proj.addTarget(TARGET_NAME, TARGET_TYPE, TARGET_SUBFOLDER_NAME, TARGET_BUNDLE_ID);

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

    it('should add debug and release configurations to build configuration list', () => {
        const pbxXCBuildConfigurationSection = proj.pbxXCBuildConfigurationSection();
        const pbxXCConfigurationList = proj.pbxXCConfigurationList();
        const target = proj.addTarget(TARGET_NAME, TARGET_TYPE, TARGET_SUBFOLDER_NAME);

        assert.ok(target.pbxNativeTarget.buildConfigurationList);
        assert.ok(pbxXCConfigurationList[target.pbxNativeTarget.buildConfigurationList]);
        const buildConfigurations = pbxXCConfigurationList[target.pbxNativeTarget.buildConfigurationList].buildConfigurations;
        assert.ok(buildConfigurations);
        assert.equal(buildConfigurations.length, 2);

        buildConfigurations.forEach((config, index) => {
            const configUuid = config.value;
            assert.ok(configUuid);
            const pbxConfig = pbxXCBuildConfigurationSection[configUuid];
            assert.ok(pbxConfig);
            assert.equal(pbxConfig.name, index === 0 ? 'Debug' : 'Release');
            assert.equal(pbxConfig.isa, 'XCBuildConfiguration');
            assert.ok(pbxConfig.buildSettings);
            if (index === 0) {
                const debugConfig = pbxConfig.buildSettings.GCC_PREPROCESSOR_DEFINITIONS;
                assert.ok(debugConfig);
                assert.equal(debugConfig.length, 2);
                assert.equal(debugConfig[0], '"DEBUG=1"');
                assert.equal(debugConfig[1], '"$(inherited)"');
            }
            assert.equal(pbxConfig.buildSettings.INFOPLIST_FILE, '"' + TARGET_SUBFOLDER_NAME + '/' + TARGET_SUBFOLDER_NAME + '-Info.plist"');
            assert.equal(pbxConfig.buildSettings.LD_RUNPATH_SEARCH_PATHS, '"$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks"');
            assert.equal(pbxConfig.buildSettings.PRODUCT_NAME, '"' + TARGET_NAME + '"');
            assert.equal(pbxConfig.buildSettings.SKIP_INSTALL, 'YES');
        });
    });

    it('should add to build configuration list with default configuration name', () => {
        const pbxXCConfigurationList = proj.pbxXCConfigurationList();
        const target = proj.addTarget(TARGET_NAME, TARGET_TYPE, TARGET_SUBFOLDER_NAME);

        assert.ok(target.pbxNativeTarget.buildConfigurationList);
        assert.ok(pbxXCConfigurationList[target.pbxNativeTarget.buildConfigurationList]);
        assert.equal(pbxXCConfigurationList[target.pbxNativeTarget.buildConfigurationList].defaultConfigurationName, 'Release');
    });

    it('should add to build configuration list with comment', () => {
        const pbxXCConfigurationList = proj.pbxXCConfigurationList();
        const target = proj.addTarget(TARGET_NAME, TARGET_TYPE, TARGET_SUBFOLDER_NAME);

        const buildCommentKey = target.pbxNativeTarget.buildConfigurationList + '_comment';
        assert.ok(pbxXCConfigurationList[buildCommentKey]);
        assert.equal(pbxXCConfigurationList[buildCommentKey], 'Build configuration list for PBXNativeTarget "' + TARGET_NAME + '"');
    });

    it('should create a new target and add source, framework, resource and header files and the corresponding build phases', () => {
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

    it('should create target with correct pbxNativeTarget name', () => {
        const target = proj.addTarget(TARGET_NAME, TARGET_TYPE, TARGET_SUBFOLDER_NAME);

        const quotedTargetName = '"' + TARGET_NAME + '"';
        assert.equal(target.pbxNativeTarget.name, quotedTargetName);
        assert.equal(target.pbxNativeTarget.productName, quotedTargetName);
    });

    it('should add build phase for extension target', () => {
        const target = proj.addTarget(TARGET_NAME, TARGET_TYPE);
        assert.ok(target.uuid);

        const phases = proj.pbxCopyfilesBuildPhaseObj(target.uuid);
        assert.ok(phases);
        assert.ok(phases.files);
        assert.equal(phases.files.length, 1);
    });

    it('should not add build phase for non-extension target', () => {
        const target = proj.addTarget(TARGET_NAME, 'application');
        assert.ok(target.uuid);

        const phases = proj.pbxCopyfilesBuildPhaseObj(target.uuid);
        assert.ok(!phases);
    });

    it('should add target as a target dependency to the main target', () => {
        const target = proj.addTarget(TARGET_NAME, TARGET_TYPE);
        assert.ok(target);
        assert.ok(target.uuid);

        const pbxTargetDependencySection = proj.hash.project.objects.PBXTargetDependency;

        const targetDependencyUuid = Object.keys(pbxTargetDependencySection).find((key) => pbxTargetDependencySection[key].target === target.uuid);
        assert.ok(targetDependencyUuid);

        const firstTarget = proj.getFirstTarget();
        assert.ok(firstTarget);
        assert.ok(firstTarget.firstTarget);
        assert.ok(firstTarget.firstTarget.dependencies);

        const firstTargetMatchingDependency = firstTarget.firstTarget.dependencies.find((elem) => elem.value === targetDependencyUuid);
        assert.ok(firstTargetMatchingDependency);
    });

    it('should have "wrapper.application" filetype for application product', () => {
        const target = proj.addTarget(TARGET_NAME, 'application');
        assert.ok(target);
        assert.ok(target.pbxNativeTarget);
        assert.ok(target.pbxNativeTarget.productReference);

        const productFile = proj.pbxFileReferenceSection()[target.pbxNativeTarget.productReference];
        assert.ok(productFile);
        assert.ok(productFile.explicitFileType);
        assert.equal(productFile.explicitFileType, '"wrapper.application"');
    });

    it('should have "wrapper.app-extension" filetype for app_extension product', () => {
        const target = proj.addTarget(TARGET_NAME, 'app_extension');
        assert.ok(target);
        assert.ok(target.pbxNativeTarget);
        assert.ok(target.pbxNativeTarget.productReference);

        const productFile = proj.pbxFileReferenceSection()[target.pbxNativeTarget.productReference];
        assert.ok(productFile);
        assert.ok(productFile.explicitFileType);
        assert.equal(productFile.explicitFileType, '"wrapper.app-extension"');
    });

    it('should have "wrapper.plug-in" filetype for bundle product', () => {
        const target = proj.addTarget(TARGET_NAME, 'bundle');
        assert.ok(target);
        assert.ok(target.pbxNativeTarget);
        assert.ok(target.pbxNativeTarget.productReference);

        const productFile = proj.pbxFileReferenceSection()[target.pbxNativeTarget.productReference];
        assert.ok(productFile);
        assert.ok(productFile.explicitFileType);
        assert.equal(productFile.explicitFileType, '"wrapper.plug-in"');
    });

    it('should have "compiled.mach-o.dylib" filetype for command_line_tool product', () => {
        const target = proj.addTarget(TARGET_NAME, 'command_line_tool');
        assert.ok(target);
        assert.ok(target.pbxNativeTarget);
        assert.ok(target.pbxNativeTarget.productReference);

        const productFile = proj.pbxFileReferenceSection()[target.pbxNativeTarget.productReference];
        assert.ok(productFile);
        assert.ok(productFile.explicitFileType);
        assert.equal(productFile.explicitFileType, '"compiled.mach-o.dylib"');
    });

    it('should have "compiled.mach-o.dylib" filetype for dynamic_library product', () => {
        const target = proj.addTarget(TARGET_NAME, 'dynamic_library');
        assert.ok(target);
        assert.ok(target.pbxNativeTarget);
        assert.ok(target.pbxNativeTarget.productReference);

        const productFile = proj.pbxFileReferenceSection()[target.pbxNativeTarget.productReference];
        assert.ok(productFile);
        assert.ok(productFile.explicitFileType);
        assert.equal(productFile.explicitFileType, '"compiled.mach-o.dylib"');
    });

    it('should have "wrapper.framework" filetype for framework product', () => {
        const target = proj.addTarget(TARGET_NAME, 'framework');
        assert.ok(target);
        assert.ok(target.pbxNativeTarget);
        assert.ok(target.pbxNativeTarget.productReference);

        const productFile = proj.pbxFileReferenceSection()[target.pbxNativeTarget.productReference];
        assert.ok(productFile);
        assert.ok(productFile.explicitFileType);
        assert.equal(productFile.explicitFileType, '"wrapper.framework"');
    });

    it('should have "archive.ar" filetype for static_library product', () => {
        const target = proj.addTarget(TARGET_NAME, 'static_library');
        assert.ok(target);
        assert.ok(target.pbxNativeTarget);
        assert.ok(target.pbxNativeTarget.productReference);

        const productFile = proj.pbxFileReferenceSection()[target.pbxNativeTarget.productReference];
        assert.ok(productFile);
        assert.ok(productFile.explicitFileType);
        assert.equal(productFile.explicitFileType, '"archive.ar"');
    });

    it('should have "wrapper.cfbundle" filetype for unit_test_bundle product', () => {
        const target = proj.addTarget(TARGET_NAME, 'unit_test_bundle');
        assert.ok(target);
        assert.ok(target.pbxNativeTarget);
        assert.ok(target.pbxNativeTarget.productReference);

        const productFile = proj.pbxFileReferenceSection()[target.pbxNativeTarget.productReference];
        assert.ok(productFile);
        assert.ok(productFile.explicitFileType);
        assert.equal(productFile.explicitFileType, '"wrapper.cfbundle"');
    });

    it('should have "wrapper.application" filetype for watch_app product', () => {
        const target = proj.addTarget(TARGET_NAME, 'watch_app');
        assert.ok(target);
        assert.ok(target.pbxNativeTarget);
        assert.ok(target.pbxNativeTarget.productReference);

        const productFile = proj.pbxFileReferenceSection()[target.pbxNativeTarget.productReference];
        assert.ok(productFile);
        assert.ok(productFile.explicitFileType);
        assert.equal(productFile.explicitFileType, '"wrapper.application"');
    });

    it('should have "wrapper.application" filetype for watch2_app product', () => {
        const target = proj.addTarget(TARGET_NAME, 'watch2_app');
        assert.ok(target);
        assert.ok(target.pbxNativeTarget);
        assert.ok(target.pbxNativeTarget.productReference);

        const productFile = proj.pbxFileReferenceSection()[target.pbxNativeTarget.productReference];
        assert.ok(productFile);
        assert.ok(productFile.explicitFileType);
        assert.equal(productFile.explicitFileType, '"wrapper.application"');
    });

    it('should have "wrapper.app-extension" filetype for watch_extension product', () => {
        const target = proj.addTarget(TARGET_NAME, 'watch_extension');
        assert.ok(target);
        assert.ok(target.pbxNativeTarget);
        assert.ok(target.pbxNativeTarget.productReference);

        const productFile = proj.pbxFileReferenceSection()[target.pbxNativeTarget.productReference];
        assert.ok(productFile);
        assert.ok(productFile.explicitFileType);
        assert.equal(productFile.explicitFileType, '"wrapper.app-extension"');
    });

    it('should have "wrapper.app-extension" filetype for watch2_extension product', () => {
        const target = proj.addTarget(TARGET_NAME, 'watch2_extension');
        assert.ok(target);
        assert.ok(target.pbxNativeTarget);
        assert.ok(target.pbxNativeTarget.productReference);

        const productFile = proj.pbxFileReferenceSection()[target.pbxNativeTarget.productReference];
        assert.ok(productFile);
        assert.ok(productFile.explicitFileType);
        assert.equal(productFile.explicitFileType, '"wrapper.app-extension"');
    });
});

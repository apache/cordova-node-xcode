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
    pbxFile = require('../lib/pbxFile'),
    proj = new pbx('.');

function cleanHash() {
    return JSON.parse(fullProjectStr);
}

var TARGET_NAME = 'TestExtension',
    TARGET_TYPE = 'app_extension',
    TARGET_SUBFOLDER_NAME = 'TestExtensionFiles',
    TARGET_BUNDLE_ID ="com.cordova.test.appextension";

exports.setUp = function (callback) {
    proj.hash = cleanHash();
    callback();
}

exports.addTarget = {
    'should throw when target name is missing': function (test) {
        test.throws(function() {
            proj.addTarget(null, TARGET_TYPE);
        });

        test.done();
    },
    'should throw when provided blank or empty target name': function (test) {
        test.throws(function() {
            proj.addTarget('', TARGET_TYPE);
        }, function (error) {
            return (error instanceof Error) && /Target name missing/i.test(error);
        });

        test.throws(function() {
            proj.addTarget('   ', TARGET_TYPE);
        }, function (error) {
            return (error instanceof Error) && /Target name missing/i.test(error);
        });

        test.done();
    },
    'should throw when target type missing': function (test) {
        test.throws(function() {
            proj.addTarget(TARGET_NAME, null);
        }, function (error) {
            return (error instanceof Error) && /Target type missing/i.test(error);
        });

        test.done();
    },
    'should throw when invalid target type': function (test) {
        test.throws(function() {
            proj.addTarget(TARGET_NAME, 'invalid_target_type');
        }, function (error) {
            return (error instanceof Error) && /Target type invalid/i.test(error);
        });

        test.done();
    },
    'should create a new target': function (test) {
        var target = proj.addTarget(TARGET_NAME, TARGET_TYPE, TARGET_SUBFOLDER_NAME);

        test.ok(typeof target == 'object');
        test.ok(target.uuid);
        test.ok(target.pbxNativeTarget);
        test.ok(target.pbxNativeTarget.isa);
        test.ok(target.pbxNativeTarget.name);
        test.ok(target.pbxNativeTarget.productName);
        test.ok(target.pbxNativeTarget.productReference);
        test.ok(target.pbxNativeTarget.productType);
        test.ok(target.pbxNativeTarget.buildConfigurationList);
        test.ok(target.pbxNativeTarget.buildPhases);
        test.ok(target.pbxNativeTarget.buildRules);
        test.ok(target.pbxNativeTarget.dependencies);

        test.done();
    },
    'should create a new target with bundleid': function (test) {
        var target = proj.addTarget(TARGET_NAME, TARGET_TYPE, TARGET_SUBFOLDER_NAME, TARGET_BUNDLE_ID);

        test.ok(typeof target == 'object');
        test.ok(target.uuid);
        test.ok(target.pbxNativeTarget);
        test.ok(target.pbxNativeTarget.isa);
        test.ok(target.pbxNativeTarget.name);
        test.ok(target.pbxNativeTarget.productName);
        test.ok(target.pbxNativeTarget.productReference);
        test.ok(target.pbxNativeTarget.productType);
        test.ok(target.pbxNativeTarget.buildConfigurationList);
        test.ok(target.pbxNativeTarget.buildPhases);
        test.ok(target.pbxNativeTarget.buildRules);
        test.ok(target.pbxNativeTarget.dependencies);
  
        test.done();
    },
    'should add debug and release configurations to build configuration list': function (test) {
        var pbxXCBuildConfigurationSection = proj.pbxXCBuildConfigurationSection(),
            pbxXCConfigurationList = proj.pbxXCConfigurationList(),
            target = proj.addTarget(TARGET_NAME, TARGET_TYPE, TARGET_SUBFOLDER_NAME);

        test.ok(target.pbxNativeTarget.buildConfigurationList);
        test.ok(pbxXCConfigurationList[target.pbxNativeTarget.buildConfigurationList]);
        var buildConfigurations = pbxXCConfigurationList[target.pbxNativeTarget.buildConfigurationList].buildConfigurations;
        test.ok(buildConfigurations);
        test.equal(buildConfigurations.length, 2);

        buildConfigurations.forEach((config, index) => {
            var configUuid = config.value;
            test.ok(configUuid);
            var pbxConfig = pbxXCBuildConfigurationSection[configUuid];
            test.ok(pbxConfig);
            test.equal(pbxConfig.name, index === 0 ? 'Debug' : 'Release');
            test.equal(pbxConfig.isa, 'XCBuildConfiguration');
            test.ok(pbxConfig.buildSettings);
            if (index === 0) {
                var debugConfig = pbxConfig.buildSettings['GCC_PREPROCESSOR_DEFINITIONS'];
                test.ok(debugConfig);
                test.equal(debugConfig.length, 2);
                test.equal(debugConfig[0], '"DEBUG=1"');
                test.equal(debugConfig[1], '"$(inherited)"');
            }
            test.equal(pbxConfig.buildSettings['INFOPLIST_FILE'], '"' + TARGET_SUBFOLDER_NAME + '/' + TARGET_SUBFOLDER_NAME + '-Info.plist"');
            test.equal(pbxConfig.buildSettings['LD_RUNPATH_SEARCH_PATHS'], '"$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks"');
            test.equal(pbxConfig.buildSettings['PRODUCT_NAME'], '"' + TARGET_NAME + '"');
            test.equal(pbxConfig.buildSettings['SKIP_INSTALL'], 'YES');
        });

        test.done();
    },
    'should add to build configuration list with default configuration name': function (test) {
        var pbxXCConfigurationList = proj.pbxXCConfigurationList(),
            target = proj.addTarget(TARGET_NAME, TARGET_TYPE, TARGET_SUBFOLDER_NAME);

        test.ok(target.pbxNativeTarget.buildConfigurationList);
        test.ok(pbxXCConfigurationList[target.pbxNativeTarget.buildConfigurationList]);
        test.equal(pbxXCConfigurationList[target.pbxNativeTarget.buildConfigurationList].defaultConfigurationName, 'Release');

        test.done();
    },
    'should add to build configuration list with comment': function (test) {
        var pbxXCConfigurationList = proj.pbxXCConfigurationList(),
            target = proj.addTarget(TARGET_NAME, TARGET_TYPE, TARGET_SUBFOLDER_NAME);

        var buildCommentKey = target.pbxNativeTarget.buildConfigurationList + '_comment';
        test.ok(pbxXCConfigurationList[buildCommentKey]);
        test.equals(pbxXCConfigurationList[buildCommentKey], 'Build configuration list for PBXNativeTarget "' + TARGET_NAME + '"');

        test.done();
    },
    'should create a new target and add source, framework, resource and header files and the corresponding build phases': function (test) {
        var target = proj.addTarget(TARGET_NAME, TARGET_TYPE, TARGET_SUBFOLDER_NAME),
            options = { 'target' : target.uuid };

        var sourceFile = proj.addSourceFile('Plugins/file.m', options),
            sourcePhase = proj.addBuildPhase([], 'PBXSourcesBuildPhase', 'Sources', target.uuid),
            resourceFile = proj.addResourceFile('assets.bundle', options),
            resourcePhase = proj.addBuildPhase([], 'PBXResourcesBuildPhase', 'Resources', target.uuid),
            frameworkFile = proj.addFramework('libsqlite3.dylib', options);
            frameworkPhase = proj.addBuildPhase([], 'PBXFrameworkBuildPhase', 'Frameworks', target.uuid),
            headerFile = proj.addHeaderFile('file.h', options);

        test.ok(sourcePhase);
        test.ok(resourcePhase);
        test.ok(frameworkPhase);

        test.equal(sourceFile.constructor, pbxFile);
        test.equal(resourceFile.constructor, pbxFile);
        test.equal(frameworkFile.constructor, pbxFile);
        test.equal(headerFile.constructor, pbxFile);

        test.ok(typeof target == 'object');
        test.ok(target.uuid);
        test.ok(target.pbxNativeTarget);
        test.ok(target.pbxNativeTarget.isa);
        test.ok(target.pbxNativeTarget.name);
        test.ok(target.pbxNativeTarget.productName);
        test.ok(target.pbxNativeTarget.productReference);
        test.ok(target.pbxNativeTarget.productType);
        test.ok(target.pbxNativeTarget.buildConfigurationList);
        test.ok(target.pbxNativeTarget.buildPhases);
        test.ok(target.pbxNativeTarget.buildRules);
        test.ok(target.pbxNativeTarget.dependencies);

        test.done();
    },
    'should create target with correct pbxNativeTarget name': function (test) {
        var target = proj.addTarget(TARGET_NAME, TARGET_TYPE, TARGET_SUBFOLDER_NAME);

        var quotedTargetName = '"' + TARGET_NAME + '"';
        test.equals(target.pbxNativeTarget.name, quotedTargetName);
        test.equals(target.pbxNativeTarget.productName, quotedTargetName);

        test.done();
    },
    'should add build phase for extension target': function (test) {
        var target = proj.addTarget(TARGET_NAME, TARGET_TYPE);
        test.ok(target.uuid);

        var phases = proj.pbxCopyfilesBuildPhaseObj(target.uuid);
        test.ok(phases);
        test.ok(phases.files);
        test.equal(phases.files.length, 1);

        test.done();
    },
    'should not add build phase for non-extension target': function (test) {
        var target = proj.addTarget(TARGET_NAME, 'application');
        test.ok(target.uuid);

        var phases = proj.pbxCopyfilesBuildPhaseObj(target.uuid);
        test.ok(!phases);

        test.done();
    },
    'should add target as a target dependency to the main target': function (test) {
        var target = proj.addTarget(TARGET_NAME, TARGET_TYPE);
        test.ok(target);
        test.ok(target.uuid);

        var pbxTargetDependencySection = proj.hash.project.objects['PBXTargetDependency'];

        var targetDependencyUuid = Object.keys(pbxTargetDependencySection).find( (key) => pbxTargetDependencySection[key].target === target.uuid);
        test.ok(targetDependencyUuid);

        var firstTarget = proj.getFirstTarget();
        test.ok(firstTarget);
        test.ok(firstTarget.firstTarget);
        test.ok(firstTarget.firstTarget.dependencies);

        var firstTargetMatchingDependency = firstTarget.firstTarget.dependencies.find( (elem) => elem.value === targetDependencyUuid);
        test.ok(firstTargetMatchingDependency);

        test.done();
    },
    'should have "wrapper.application" filetype for application product': function (test) {
        var target = proj.addTarget(TARGET_NAME, 'application');
        test.ok(target);
        test.ok(target.pbxNativeTarget);
        test.ok(target.pbxNativeTarget.productReference);

        var productFile = proj.pbxFileReferenceSection()[target.pbxNativeTarget.productReference];
        test.ok(productFile);
        test.ok(productFile.explicitFileType);
        test.equal(productFile.explicitFileType, '"wrapper.application"');

        test.done();
    },
    'should have "wrapper.app-extension" filetype for app_extension product': function (test) {
        var target = proj.addTarget(TARGET_NAME, 'app_extension');
        test.ok(target);
        test.ok(target.pbxNativeTarget);
        test.ok(target.pbxNativeTarget.productReference);

        var productFile = proj.pbxFileReferenceSection()[target.pbxNativeTarget.productReference];
        test.ok(productFile);
        test.ok(productFile.explicitFileType);
        test.equal(productFile.explicitFileType, '"wrapper.app-extension"');

        test.done();
    },
    'should have "wrapper.plug-in" filetype for bundle product': function (test) {
        var target = proj.addTarget(TARGET_NAME, 'bundle');
        test.ok(target);
        test.ok(target.pbxNativeTarget);
        test.ok(target.pbxNativeTarget.productReference);

        var productFile = proj.pbxFileReferenceSection()[target.pbxNativeTarget.productReference];
        test.ok(productFile);
        test.ok(productFile.explicitFileType);
        test.equal(productFile.explicitFileType, '"wrapper.plug-in"');

        test.done();
    },
    'should have "compiled.mach-o.dylib" filetype for command_line_tool product': function (test) {
        var target = proj.addTarget(TARGET_NAME, 'command_line_tool');
        test.ok(target);
        test.ok(target.pbxNativeTarget);
        test.ok(target.pbxNativeTarget.productReference);

        var productFile = proj.pbxFileReferenceSection()[target.pbxNativeTarget.productReference];
        test.ok(productFile);
        test.ok(productFile.explicitFileType);
        test.equal(productFile.explicitFileType, '"compiled.mach-o.dylib"');

        test.done();
    },
    'should have "compiled.mach-o.dylib" filetype for dynamic_library product': function (test) {
        var target = proj.addTarget(TARGET_NAME, 'dynamic_library');
        test.ok(target);
        test.ok(target.pbxNativeTarget);
        test.ok(target.pbxNativeTarget.productReference);

        var productFile = proj.pbxFileReferenceSection()[target.pbxNativeTarget.productReference];
        test.ok(productFile);
        test.ok(productFile.explicitFileType);
        test.equal(productFile.explicitFileType, '"compiled.mach-o.dylib"');

        test.done();
    },
    'should have "wrapper.framework" filetype for framework product': function (test) {
        var target = proj.addTarget(TARGET_NAME, 'framework');
        test.ok(target);
        test.ok(target.pbxNativeTarget);
        test.ok(target.pbxNativeTarget.productReference);

        var productFile = proj.pbxFileReferenceSection()[target.pbxNativeTarget.productReference];
        test.ok(productFile);
        test.ok(productFile.explicitFileType);
        test.equal(productFile.explicitFileType, '"wrapper.framework"');

        test.done();
    },
    'should have "archive.ar" filetype for static_library product': function (test) {
        var target = proj.addTarget(TARGET_NAME, 'static_library');
        test.ok(target);
        test.ok(target.pbxNativeTarget);
        test.ok(target.pbxNativeTarget.productReference);

        var productFile = proj.pbxFileReferenceSection()[target.pbxNativeTarget.productReference];
        test.ok(productFile);
        test.ok(productFile.explicitFileType);
        test.equal(productFile.explicitFileType, '"archive.ar"');

        test.done();
    },
    'should have "wrapper.cfbundle" filetype for unit_test_bundle product': function (test) {
        var target = proj.addTarget(TARGET_NAME, 'unit_test_bundle');
        test.ok(target);
        test.ok(target.pbxNativeTarget);
        test.ok(target.pbxNativeTarget.productReference);

        var productFile = proj.pbxFileReferenceSection()[target.pbxNativeTarget.productReference];
        test.ok(productFile);
        test.ok(productFile.explicitFileType);
        test.equal(productFile.explicitFileType, '"wrapper.cfbundle"');

        test.done();
    },
    'should have "wrapper.application" filetype for watch_app product': function (test) {
        var target = proj.addTarget(TARGET_NAME, 'watch_app');
        test.ok(target);
        test.ok(target.pbxNativeTarget);
        test.ok(target.pbxNativeTarget.productReference);

        var productFile = proj.pbxFileReferenceSection()[target.pbxNativeTarget.productReference];
        test.ok(productFile);
        test.ok(productFile.explicitFileType);
        test.equal(productFile.explicitFileType, '"wrapper.application"');

        test.done();
    },
    'should have "wrapper.application" filetype for watch2_app product': function (test) {
        var target = proj.addTarget(TARGET_NAME, 'watch2_app');
        test.ok(target);
        test.ok(target.pbxNativeTarget);
        test.ok(target.pbxNativeTarget.productReference);

        var productFile = proj.pbxFileReferenceSection()[target.pbxNativeTarget.productReference];
        test.ok(productFile);
        test.ok(productFile.explicitFileType);
        test.equal(productFile.explicitFileType, '"wrapper.application"');

        test.done();
    },
    'should have "wrapper.app-extension" filetype for watch_extension product': function (test) {
        var target = proj.addTarget(TARGET_NAME, 'watch_extension');
        test.ok(target);
        test.ok(target.pbxNativeTarget);
        test.ok(target.pbxNativeTarget.productReference);

        var productFile = proj.pbxFileReferenceSection()[target.pbxNativeTarget.productReference];
        test.ok(productFile);
        test.ok(productFile.explicitFileType);
        test.equal(productFile.explicitFileType, '"wrapper.app-extension"');

        test.done();
    },
    'should have "wrapper.app-extension" filetype for watch2_extension product': function (test) {
        var target = proj.addTarget(TARGET_NAME, 'watch2_extension');
        test.ok(target);
        test.ok(target.pbxNativeTarget);
        test.ok(target.pbxNativeTarget.productReference);

        var productFile = proj.pbxFileReferenceSection()[target.pbxNativeTarget.productReference];
        test.ok(productFile);
        test.ok(productFile.explicitFileType);
        test.equal(productFile.explicitFileType, '"wrapper.app-extension"');

        test.done();
    }
}

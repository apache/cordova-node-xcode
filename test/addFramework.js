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

var fullProject = require('./fixtures/full-project');

var fullProjectStr = JSON.stringify(fullProject);
var pbx = require('../lib/pbxProject');
var pbxFile = require('../lib/pbxFile');
var proj = new pbx('.');

function cleanHash () {
    return JSON.parse(fullProjectStr);
}

exports.setUp = function (callback) {
    proj.hash = cleanHash();
    callback();
};

function nonComments (obj) {
    var keys = Object.keys(obj);
    var newObj = {};
    var i = 0;

    for (i; i < keys.length; i++) {
        if (!/_comment$/.test(keys[i])) {
            newObj[keys[i]] = obj[keys[i]];
        }
    }

    return newObj;
}

function frameworkSearchPaths (proj) {
    var configs = nonComments(proj.pbxXCBuildConfigurationSection());
    var allPaths = [];
    var ids = Object.keys(configs);
    var i;
    var buildSettings;

    for (i = 0; i < ids.length; i++) {
        buildSettings = configs[ids[i]].buildSettings;

        if (buildSettings.FRAMEWORK_SEARCH_PATHS) {
            allPaths.push(buildSettings.FRAMEWORK_SEARCH_PATHS);
        }
    }

    return allPaths;
}

exports.addFramework = {
    'should return a pbxFile': function (test) {
        var newFile = proj.addFramework('libsqlite3.dylib');

        test.equal(newFile.constructor, pbxFile);
        test.done();
    },
    'should set a fileRef on the pbxFile': function (test) {
        var newFile = proj.addFramework('libsqlite3.dylib');

        test.ok(newFile.fileRef);
        test.done();
    },
    'should populate the PBXFileReference section with 2 fields': function (test) {
        var newFile = proj.addFramework('libsqlite3.dylib');
        fileRefSection = proj.pbxFileReferenceSection(),
        frsLength = Object.keys(fileRefSection).length;

        test.equal(68, frsLength);
        test.ok(fileRefSection[newFile.fileRef]);
        test.ok(fileRefSection[newFile.fileRef + '_comment']);

        test.done();
    },
    'should populate the PBXFileReference comment correctly': function (test) {
        var newFile = proj.addFramework('libsqlite3.dylib');
        fileRefSection = proj.pbxFileReferenceSection(),
        commentKey = newFile.fileRef + '_comment';

        test.equal(fileRefSection[commentKey], 'libsqlite3.dylib');
        test.done();
    },
    'should add the PBXFileReference object correctly': function (test) {
        var newFile = proj.addFramework('libsqlite3.dylib');
        var fileRefSection = proj.pbxFileReferenceSection();
        var fileRefEntry = fileRefSection[newFile.fileRef];

        test.equal(fileRefEntry.isa, 'PBXFileReference');
        test.equal(fileRefEntry.lastKnownFileType, 'compiled.mach-o.dylib');
        test.equal(fileRefEntry.name, '"libsqlite3.dylib"');
        test.equal(fileRefEntry.path, '"usr/lib/libsqlite3.dylib"');
        test.equal(fileRefEntry.sourceTree, 'SDKROOT');

        test.done();
    },
    'should populate the PBXBuildFile section with 2 fields': function (test) {
        var newFile = proj.addFramework('libsqlite3.dylib');
        var buildFileSection = proj.pbxBuildFileSection();
        var bfsLength = Object.keys(buildFileSection).length;

        test.equal(60, bfsLength);
        test.ok(buildFileSection[newFile.uuid]);
        test.ok(buildFileSection[newFile.uuid + '_comment']);

        test.done();
    },
    'should add the PBXBuildFile comment correctly': function (test) {
        var newFile = proj.addFramework('libsqlite3.dylib');
        var commentKey = newFile.uuid + '_comment';
        var buildFileSection = proj.pbxBuildFileSection();

        test.equal(buildFileSection[commentKey], 'libsqlite3.dylib in Frameworks');
        test.done();
    },
    'should add the PBXBuildFile object correctly': function (test) {
        var newFile = proj.addFramework('libsqlite3.dylib');
        var buildFileSection = proj.pbxBuildFileSection();
        var buildFileEntry = buildFileSection[newFile.uuid];

        test.equal(buildFileEntry.isa, 'PBXBuildFile');
        test.equal(buildFileEntry.fileRef, newFile.fileRef);
        test.equal(buildFileEntry.fileRef_comment, 'libsqlite3.dylib');
        test.equal(buildFileEntry.settings, undefined);

        test.done();
    },
    'should add the PBXBuildFile object correctly /w weak linked frameworks': function (test) {
        var newFile = proj.addFramework('libsqlite3.dylib', { weak: true });
        var buildFileSection = proj.pbxBuildFileSection();
        var buildFileEntry = buildFileSection[newFile.uuid];

        test.equal(buildFileEntry.isa, 'PBXBuildFile');
        test.equal(buildFileEntry.fileRef, newFile.fileRef);
        test.equal(buildFileEntry.fileRef_comment, 'libsqlite3.dylib');
        test.deepEqual(buildFileEntry.settings, { ATTRIBUTES: ['Weak'] });

        test.done();
    },
    'should add to the Frameworks PBXGroup': function (test) {
        var newLength = proj.pbxGroupByName('Frameworks').children.length + 1;
        var newFile = proj.addFramework('libsqlite3.dylib');
        var frameworks = proj.pbxGroupByName('Frameworks');

        test.equal(frameworks.children.length, newLength);
        test.done();
    },
    'should have the right values for the PBXGroup entry': function (test) {
        var newFile = proj.addFramework('libsqlite3.dylib');
        var frameworks = proj.pbxGroupByName('Frameworks').children;
        var framework = frameworks[frameworks.length - 1];

        test.equal(framework.comment, 'libsqlite3.dylib');
        test.equal(framework.value, newFile.fileRef);
        test.done();
    },
    'should add to the PBXFrameworksBuildPhase': function (test) {
        var newFile = proj.addFramework('libsqlite3.dylib');
        var frameworks = proj.pbxFrameworksBuildPhaseObj();

        test.equal(frameworks.files.length, 16);
        test.done();
    },
    'should not add to the PBXFrameworksBuildPhase': function (test) {
        var newFile = proj.addFramework('Private.framework', { link: false });
        var frameworks = proj.pbxFrameworksBuildPhaseObj();

        test.equal(frameworks.files.length, 15);
        test.done();
    },
    'should have the right values for the Sources entry': function (test) {
        var newFile = proj.addFramework('libsqlite3.dylib');
        var frameworks = proj.pbxFrameworksBuildPhaseObj();
        var framework = frameworks.files[15];

        test.equal(framework.comment, 'libsqlite3.dylib in Frameworks');
        test.equal(framework.value, newFile.uuid);
        test.done();
    },
    'duplicate entries': {
        'should return false': function (test) {
            var newFile = proj.addFramework('libsqlite3.dylib');

            test.ok(!proj.addFramework('libsqlite3.dylib'));
            test.done();
        }
    },
    'should pbxFile correctly for custom frameworks': function (test) {
        var newFile = proj.addFramework('/path/to/Custom.framework', { customFramework: true });

        test.ok(newFile.customFramework);
        test.ok(!newFile.fileEncoding);
        test.equal(newFile.sourceTree, '"<group>"');
        test.equal(newFile.group, 'Frameworks');
        test.equal(newFile.basename, 'Custom.framework');
        test.equal(newFile.dirname, '/path/to');
        // XXX framework has to be copied over to PROJECT root. That is what XCode does when you drag&drop
        test.equal(newFile.path, '/path/to/Custom.framework');

        // should add path to framework search path
        var frameworkPaths = frameworkSearchPaths(proj);
        expectedPath = '"\\"/path/to\\""';

        for (i = 0; i < frameworkPaths.length; i++) {
            var current = frameworkPaths[i];
            test.ok(current.indexOf('"$(inherited)"') >= 0);
            test.ok(current.indexOf(expectedPath) >= 0);
        }
        test.done();
    },
    'should add to the Embed Frameworks PBXCopyFilesBuildPhase': function (test) {
        var newFile = proj.addFramework('/path/to/SomeEmbeddableCustom.framework', { customFramework: true, embed: true });
        var frameworks = proj.pbxEmbedFrameworksBuildPhaseObj();

        var buildPhaseInPbx = proj.pbxEmbedFrameworksBuildPhaseObj();
        test.equal(buildPhaseInPbx.dstSubfolderSpec, 10);

        test.equal(frameworks.files.length, 1);
        test.done();
    },
    'should not add to the Embed Frameworks PBXCopyFilesBuildPhase by default': function (test) {
        var newFile = proj.addFramework('/path/to/Custom.framework', { customFramework: true });
        var frameworks = proj.pbxEmbedFrameworksBuildPhaseObj();

        test.equal(frameworks.files.length, 0);
        test.done();
    },
    'should add the PBXBuildFile object correctly /w signable frameworks': function (test) {
        var newFile = proj.addFramework('/path/to/SomeSignable.framework', { customFramework: true, embed: true, sign: true });
        var buildFileSection = proj.pbxBuildFileSection();
        var buildFileEntry = buildFileSection[newFile.uuid];

        test.equal(newFile.group, 'Embed Frameworks');
        test.equal(buildFileEntry.isa, 'PBXBuildFile');
        test.equal(buildFileEntry.fileRef, newFile.fileRef);
        test.equal(buildFileEntry.fileRef_comment, 'SomeSignable.framework');
        test.deepEqual(buildFileEntry.settings, { ATTRIBUTES: ['CodeSignOnCopy'] });

        test.done();
    }
};

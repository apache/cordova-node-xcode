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
const pbxFile = require('../lib/pbxFile');
const proj = new pbx('.');

function cleanHash () {
    return JSON.parse(fullProjectStr);
}

exports.setUp = function (callback) {
    proj.hash = cleanHash();
    callback();
};

function nonComments (obj) {
    const keys = Object.keys(obj);
    const newObj = {};
    let i = 0;

    for (i; i < keys.length; i++) {
        if (!/_comment$/.test(keys[i])) {
            newObj[keys[i]] = obj[keys[i]];
        }
    }

    return newObj;
}

function frameworkSearchPaths (proj) {
    const configs = nonComments(proj.pbxXCBuildConfigurationSection());
    const allPaths = [];
    const ids = Object.keys(configs);
    let i;
    let buildSettings;

    for (i = 0; i < ids.length; i++) {
        buildSettings = configs[ids[i]].buildSettings;

        if (buildSettings['FRAMEWORK_SEARCH_PATHS']) {
            allPaths.push(buildSettings['FRAMEWORK_SEARCH_PATHS']);
        }
    }

    return allPaths;
}

exports.removeFramework = {
    'should return a pbxFile': function (test) {
        const newFile = proj.addFramework('libsqlite3.dylib');

        test.equal(newFile.constructor, pbxFile);

        const deletedFile = proj.removeFramework('libsqlite3.dylib');

        test.equal(deletedFile.constructor, pbxFile);

        test.done();
    },
    'should set a fileRef on the pbxFile': function (test) {
        const newFile = proj.addFramework('libsqlite3.dylib');

        test.ok(newFile.fileRef);

        const deletedFile = proj.removeFramework('libsqlite3.dylib');

        test.ok(deletedFile.fileRef);

        test.done();
    },
    'should remove 2 fields from the PBXFileReference section': function (
        test
    ) {
        const newFile = proj.addFramework('libsqlite3.dylib');
        (fileRefSection = proj.pbxFileReferenceSection()),
        (frsLength = Object.keys(fileRefSection).length);

        test.equal(68, frsLength);
        test.ok(fileRefSection[newFile.fileRef]);
        test.ok(fileRefSection[newFile.fileRef + '_comment']);

        const deletedFile = proj.removeFramework('libsqlite3.dylib');
        frsLength = Object.keys(fileRefSection).length;

        test.equal(66, frsLength);
        test.ok(!fileRefSection[deletedFile.fileRef]);
        test.ok(!fileRefSection[deletedFile.fileRef + '_comment']);

        test.done();
    },
    'should remove 2 fields from the PBXBuildFile section': function (test) {
        const newFile = proj.addFramework('libsqlite3.dylib');
        const buildFileSection = proj.pbxBuildFileSection();
        let bfsLength = Object.keys(buildFileSection).length;

        test.equal(60, bfsLength);
        test.ok(buildFileSection[newFile.uuid]);
        test.ok(buildFileSection[newFile.uuid + '_comment']);

        const deletedFile = proj.removeFramework('libsqlite3.dylib');

        bfsLength = Object.keys(buildFileSection).length;

        test.equal(58, bfsLength);
        test.ok(!buildFileSection[deletedFile.uuid]);
        test.ok(!buildFileSection[deletedFile.uuid + '_comment']);

        test.done();
    },
    'should remove from the Frameworks PBXGroup': function (test) {
        let newLength = proj.pbxGroupByName('Frameworks').children.length + 1;
        const newFile = proj.addFramework('libsqlite3.dylib');
        const frameworks = proj.pbxGroupByName('Frameworks');

        test.equal(frameworks.children.length, newLength);

        const deletedFile = proj.removeFramework('libsqlite3.dylib');
        newLength = newLength - 1;

        test.equal(frameworks.children.length, newLength);

        test.done();
    },
    'should remove from the PBXFrameworksBuildPhase': function (test) {
        const newFile = proj.addFramework('libsqlite3.dylib');
        let frameworks = proj.pbxFrameworksBuildPhaseObj();

        test.equal(frameworks.files.length, 16);

        const deletedFile = proj.removeFramework('libsqlite3.dylib');
        frameworks = proj.pbxFrameworksBuildPhaseObj();

        test.equal(frameworks.files.length, 15);

        test.done();
    },
    'should remove custom frameworks': function (test) {
        const newFile = proj.addFramework('/path/to/Custom.framework', {
            customFramework: true
        });
        let frameworks = proj.pbxFrameworksBuildPhaseObj();

        test.equal(frameworks.files.length, 16);

        const deletedFile = proj.removeFramework('/path/to/Custom.framework', {
            customFramework: true
        });
        frameworks = proj.pbxFrameworksBuildPhaseObj();

        test.equal(frameworks.files.length, 15);

        const frameworkPaths = frameworkSearchPaths(proj);
        expectedPath = '"/path/to"';

        for (i = 0; i < frameworkPaths.length; i++) {
            const current = frameworkPaths[i];
            test.ok(current.indexOf(expectedPath) == -1);
        }

        test.done();
    },
    'should remove embedded frameworks': function (test) {
        const newFile = proj.addFramework('/path/to/Custom.framework', {
            customFramework: true,
            embed: true,
            sign: true
        });
        let frameworks = proj.pbxFrameworksBuildPhaseObj();
        let buildFileSection = proj.pbxBuildFileSection();
        let bfsLength = Object.keys(buildFileSection).length;

        test.equal(frameworks.files.length, 16);
        test.equal(62, bfsLength);

        const deletedFile = proj.removeFramework('/path/to/Custom.framework', {
            customFramework: true,
            embed: true
        });
        frameworks = proj.pbxFrameworksBuildPhaseObj();
        buildFileSection = proj.pbxBuildFileSection();
        bfsLength = Object.keys(buildFileSection).length;

        test.equal(frameworks.files.length, 15);
        test.equal(58, bfsLength);

        const frameworkPaths = frameworkSearchPaths(proj);
        expectedPath = '"/path/to"';

        for (i = 0; i < frameworkPaths.length; i++) {
            const current = frameworkPaths[i];
            test.ok(current.indexOf(expectedPath) == -1);
        }

        test.done();
    }
};

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

const fullProject = require('./fixtures/multiple-targets');
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

exports.addFilesToTarget = {
    'should add the file to a proper target': function (test) {
        const target = '1D6058900D05DD3D006BFB54';
        const filename = 'file.m';

        const opt = { target: target };
        const newFile = proj.addSourceFile(filename, opt);

        test.equal(newFile.constructor, pbxFile);

        const sources = proj.pbxSourcesBuildPhaseObj(target);
        test.equal(sources.files[5].comment, filename + ' in Sources');

        test.done();
    },
    'should remove the file from the proper target': function (test) {
        const target = '1D6058900D05DD3D006BFB54';
        const filename = 'file.m';

        const opt = { target: target };
        const newFile = proj.addSourceFile(filename, opt);

        test.equal(newFile.constructor, pbxFile);

        let sources = proj.pbxSourcesBuildPhaseObj(target);
        test.equal(sources.files[5].comment, filename + ' in Sources');
        const l = sources.files.length;

        proj.removeSourceFile(filename, opt);
        sources = proj.pbxSourcesBuildPhaseObj(target);
        test.equal(sources.files.length, l - 1);

        test.done();
    },
    'should fail when specifying an invalid target': function (test) {
        const target = 'XXXXX';
        const filename = 'file.m';

        const opt = { target: target };
        test.throws(function () {
            proj.addSourceFile(filename, opt);
        });

        test.done();
    },
    'should add the library to a proper target': function (test) {
        const target = '1D6058900D05DD3D006BFB54';
        const filename = 'library.lib';

        const opt = { target: target };
        const newFile = proj.addStaticLibrary(filename, opt);

        test.equal(newFile.constructor, pbxFile);

        const libraries = proj.pbxFrameworksBuildPhaseObj(target);
        test.equal(libraries.files[4].comment, filename + ' in Resources');

        test.done();
    },
    'should remove the library to a proper target': function (test) {
        const target = '1D6058900D05DD3D006BFB54';
        const filename = 'library.lib';

        const opt = { target: target };
        const newFile = proj.addStaticLibrary(filename, opt);

        test.equal(newFile.constructor, pbxFile);

        let libraries = proj.pbxFrameworksBuildPhaseObj(target);
        test.equal(libraries.files[4].comment, filename + ' in Resources');
        const l = libraries.files.length;

        proj.removeFramework(filename, opt);
        libraries = proj.pbxFrameworksBuildPhaseObj(target);
        test.equal(libraries.files.length, l - 1);

        test.done();
    },
    'should add the framework to a proper target': function (test) {
        const target = '1D6058900D05DD3D006BFB54';
        const filename = 'delta.framework';

        const opt = { target: target };
        const newFile = proj.addFramework(filename, opt);

        test.equal(newFile.constructor, pbxFile);

        const frameworks = proj.pbxFrameworksBuildPhaseObj(target);
        test.equal(frameworks.files[4].comment, filename + ' in Frameworks');

        test.done();
    },
    'should add a ressource fileto a proper target': function (test) {
        const target = '1D6058900D05DD3D006BFB54';
        const filename = 'delta.png';

        const opt = { target: target };
        const newFile = proj.addResourceFile(filename, opt);

        test.equal(newFile.constructor, pbxFile);

        const resources = proj.pbxResourcesBuildPhaseObj(target);
        test.equal(resources.files[26].comment, filename + ' in Resources');

        test.done();
    },
    'should remove a ressource file from a proper target': function (test) {
        const target = '1D6058900D05DD3D006BFB54';
        const filename = 'delta.png';

        const opt = { target: target };
        const newFile = proj.addResourceFile(filename, opt);

        test.equal(newFile.constructor, pbxFile);

        let resources = proj.pbxResourcesBuildPhaseObj(target);
        test.equal(resources.files[26].comment, filename + ' in Resources');

        const l = resources.files.length;

        proj.removeResourceFile(filename, opt);
        resources = proj.pbxResourcesBuildPhaseObj(target);
        test.equal(resources.files.length, l - 1);

        test.done();
    }
};

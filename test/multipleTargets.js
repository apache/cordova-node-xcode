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

var fullProject = require('./fixtures/multiple-targets')
    fullProjectStr = JSON.stringify(fullProject),
    pbx = require('../lib/pbxProject'),
    pbxFile = require('../lib/pbxFile'),
    proj = new pbx('.');

function cleanHash() {
    return JSON.parse(fullProjectStr);
}

exports.setUp = function (callback) {
    proj.hash = cleanHash();
    callback();
}

exports.addFilesToTarget = {
    'should add the file to a proper target': function (test) {

        var target = "1D6058900D05DD3D006BFB54";
        var filename = "file.m";

        var opt = { target : target };
        var newFile = proj.addSourceFile(filename,opt);

        test.equal(newFile.constructor, pbxFile);

        var sources = proj.pbxSourcesBuildPhaseObj(target);
        test.equal(sources.files[5].comment, filename+" in Sources");

        test.done();
    },
    'should remove the file from the proper target': function (test) {

        var target = "1D6058900D05DD3D006BFB54";
        var filename = "file.m";

        var opt = { target : target };
        var newFile = proj.addSourceFile(filename,opt);

        test.equal(newFile.constructor, pbxFile);

        var sources = proj.pbxSourcesBuildPhaseObj(target);
        test.equal(sources.files[5].comment, filename+" in Sources");
        var l = sources.files.length;

        proj.removeSourceFile(filename,opt);
        var sources = proj.pbxSourcesBuildPhaseObj(target);
         test.equal(sources.files.length,l-1);

        test.done();
    },
    'should fail when specifying an invalid target': function (test) {

        var target = "XXXXX";
        var filename = "file.m";

        var opt = { target : target };
        test.throws(function(){
            proj.addSourceFile(filename,opt);
        });


        test.done();
    },
     'should add the library to a proper target': function (test) {

        var target = "1D6058900D05DD3D006BFB54";
        var filename = "library.lib";

        var opt = { target : target };
        var newFile = proj.addStaticLibrary(filename,opt);

        test.equal(newFile.constructor, pbxFile);

        var libraries = proj.pbxFrameworksBuildPhaseObj(target);
        test.equal(libraries.files[4].comment, filename+" in Resources");

        test.done();
    },
    'should remove the library to a proper target': function (test) {

        var target = "1D6058900D05DD3D006BFB54";
        var filename = "library.lib";

        var opt = { target : target };
        var newFile = proj.addStaticLibrary(filename,opt);

        test.equal(newFile.constructor, pbxFile);

        var libraries = proj.pbxFrameworksBuildPhaseObj(target);
        test.equal(libraries.files[4].comment, filename+" in Resources");
        var l = libraries.files.length;

        proj.removeFramework(filename,opt);
        var libraries = proj.pbxFrameworksBuildPhaseObj(target);
        test.equal(libraries.files.length,l-1);

        test.done();

    },
     'should add the framework to a proper target': function (test) {

        var target = "1D6058900D05DD3D006BFB54";
        var filename = "delta.framework";

        var opt = { target : target };
        var newFile = proj.addFramework(filename,opt);

        test.equal(newFile.constructor, pbxFile);

        var frameworks = proj.pbxFrameworksBuildPhaseObj(target);
        test.equal(frameworks.files[4].comment, filename+" in Frameworks");

        test.done();
    },
    'should add a ressource fileto a proper target': function (test) {

        var target = "1D6058900D05DD3D006BFB54";
        var filename = "delta.png";

        var opt = { target : target };
        var newFile = proj.addResourceFile(filename,opt);

        test.equal(newFile.constructor, pbxFile);

        var resources = proj.pbxResourcesBuildPhaseObj(target);
        test.equal(resources.files[26].comment, filename+" in Resources");

        test.done();
    },
     'should remove a ressource file from a proper target': function (test) {

        var target = "1D6058900D05DD3D006BFB54";
        var filename = "delta.png";

        var opt = { target : target };
        var newFile = proj.addResourceFile(filename,opt);

        test.equal(newFile.constructor, pbxFile);

        var resources = proj.pbxResourcesBuildPhaseObj(target);
        test.equal(resources.files[26].comment, filename+" in Resources");

        var l = resources.files.length;

        proj.removeResourceFile(filename,opt);
         var resources = proj.pbxResourcesBuildPhaseObj(target);
        test.equal(resources.files.length,l-1);

        test.done();
    },
}


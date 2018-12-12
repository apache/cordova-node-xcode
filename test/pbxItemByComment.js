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

exports.pbxItemByComment = {
    'should return PBXTargetDependency': function (test) {
        var pbxItem = proj.pbxItemByComment('PBXTargetDependency', 'PBXTargetDependency');

        test.ok(pbxItem);
        test.equals(pbxItem.isa, 'PBXTargetDependency');
        test.done()
    },
    'should return PBXContainerItemProxy': function (test) {
        var pbxItem = proj.pbxItemByComment('libPhoneGap.a', 'PBXReferenceProxy');

        test.ok(pbxItem);
        test.equals(pbxItem.isa, 'PBXReferenceProxy');
        test.done()
    },
    'should return PBXResourcesBuildPhase': function (test) {
        var pbxItem = proj.pbxItemByComment('Resources', 'PBXResourcesBuildPhase');

        test.ok(pbxItem);
        test.equals(pbxItem.isa, 'PBXResourcesBuildPhase');
        test.done()
    },
    'should return PBXShellScriptBuildPhase': function (test) {
        var pbxItem = proj.pbxItemByComment('Touch www folder', 'PBXShellScriptBuildPhase');

        test.ok(pbxItem);
        test.equals(pbxItem.isa, 'PBXShellScriptBuildPhase');
        test.done()
    },
    'should return null when PBXNativeTarget not found': function (test) {
        var pbxItem = proj.pbxItemByComment('Invalid', 'PBXTargetDependency');

        test.equal(pbxItem, null);
        test.done()
    }
}

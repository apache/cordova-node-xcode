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

exports.setUp = function (callback) {
    proj.hash = cleanHash();
    callback();
}

var PRODUCT_NAME = '"KitchenSinktablet"';

exports.addAndRemoveToFromBuildSettings = {
    'add should add the build setting to each configuration section':function(test) {
        var buildSetting = 'some/buildSetting';
        var value = 'some/buildSetting';
        proj.addToBuildSettings(buildSetting, value);
        var config = proj.pbxXCBuildConfigurationSection();
        for (var ref in config) {
            if (ref.indexOf('_comment') > -1 || config[ref].buildSettings.PRODUCT_NAME != PRODUCT_NAME) continue;
            test.ok(config[ref].buildSettings[buildSetting] === value);
        }
        test.done();
    },
    'remove should remove from the build settings in each configuration section':function(test) {
        var buildSetting = 'some/buildSetting';
        proj.addToBuildSettings(buildSetting, 'some/buildSetting');
        proj.removeFromBuildSettings(buildSetting);
        var config = proj.pbxXCBuildConfigurationSection();
        for (var ref in config) {
            if (ref.indexOf('_comment') > -1 || config[ref].buildSettings.PRODUCT_NAME != PRODUCT_NAME) continue;
            test.ok(!config[ref].buildSettings.hasOwnProperty(buildSetting));
        }
        test.done();
    }
}

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
const proj = new PBXProject('.');

function cleanHash () {
    return JSON.parse(fullProjectStr);
}

const PRODUCT_NAME = '"KitchenSinktablet"';

describe('addAndRemoveToFromBuildSettings', () => {
    beforeEach(() => {
        proj.hash = cleanHash();
    });
    it('add should add the build setting to each configuration section', () => {
        const buildSetting = 'some/buildSetting';
        const value = 'some/buildSetting';
        proj.addToBuildSettings(buildSetting, value);
        const config = proj.pbxXCBuildConfigurationSection();
        for (const ref in config) {
            if (ref.indexOf('_comment') > -1 || config[ref].buildSettings.PRODUCT_NAME != PRODUCT_NAME) continue;
            assert.ok(config[ref].buildSettings[buildSetting] === value);
        }
    });
    it('remove should remove from the build settings in each configuration section', () => {
        const buildSetting = 'some/buildSetting';
        proj.addToBuildSettings(buildSetting, 'some/buildSetting');
        proj.removeFromBuildSettings(buildSetting);
        const config = proj.pbxXCBuildConfigurationSection();
        for (const ref in config) {
            if (ref.indexOf('_comment') > -1 || config[ref].buildSettings.PRODUCT_NAME != PRODUCT_NAME) continue;
            assert.ok(!config[ref].buildSettings.hasOwnProperty(buildSetting));
        }
    });
});

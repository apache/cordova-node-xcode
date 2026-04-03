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
const pbx = require('../lib/pbxProject');
const project = new pbx('.');

function cleanHash () {
    return JSON.parse(fullProjectStr);
}

describe('knownRegions', () => {
    beforeEach(() => {
        project.hash = cleanHash();
    });

    describe('addKnownRegion', () => {
        it('should add new region to existing knownRegions', () => {
            let knownRegions = project.pbxProjectSection()[project.getFirstProject().uuid].knownRegions;
            assert.equal(knownRegions.indexOf('Spanish'), -1);

            project.addKnownRegion('Spanish');
            knownRegions = project.pbxProjectSection()[project.getFirstProject().uuid].knownRegions;
            assert.notEqual(knownRegions.indexOf('Spanish'), -1);
        });

        it('should not add region if it already exists in knownRegions', () => {
            const numberOfRegions = project.pbxProjectSection()[project.getFirstProject().uuid].knownRegions.length;

            project.addKnownRegion('German');
            const newNumberOfRegions = project.pbxProjectSection()[project.getFirstProject().uuid].knownRegions.length;
            assert.equal(numberOfRegions, newNumberOfRegions);
        });

        it('should create knownRegions array if it does not exist', () => {
            delete project.pbxProjectSection()[project.getFirstProject().uuid].knownRegions;
            assert.ok(!project.pbxProjectSection()[project.getFirstProject().uuid].knownRegions);

            project.addKnownRegion('German');
            assert.ok(project.pbxProjectSection()[project.getFirstProject().uuid].knownRegions);
        });
    });

    describe('removeKnownRegion', () => {
        it('should remove named region from knownRegions', () => {
            let knownRegions = project.pbxProjectSection()[project.getFirstProject().uuid].knownRegions;
            assert.notEqual(knownRegions.indexOf('German'), -1);

            project.removeKnownRegion('German');
            knownRegions = project.pbxProjectSection()[project.getFirstProject().uuid].knownRegions;
            assert.equal(knownRegions.indexOf('German'), -1);
        });

        it('should do nothing if named region does not exist in knownRegions', () => {
            const numberOfRegions = project.pbxProjectSection()[project.getFirstProject().uuid].knownRegions.length;

            project.removeKnownRegion('Korean');
            const newNumberOfRegions = project.pbxProjectSection()[project.getFirstProject().uuid].knownRegions.length;
            assert.equal(numberOfRegions, newNumberOfRegions);
        });
    });

    describe('hasKnownRegion', () => {
        it('should return true if named region exists in knownRegions', () => {
            assert.ok(project.hasKnownRegion('German'));
        });

        it('should return false if named region does not exist in knownRegions', () => {
            assert.ok(!project.hasKnownRegion('Ducth'));
        });
    });
});

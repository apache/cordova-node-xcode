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

const util = require('util');

const f = util.format;
const EventEmitter = require('events').EventEmitter;
const path = require('path');
const uuid = require('uuid');
const fork = require('child_process').fork;
const pbxWriter = require('./pbxWriter');
const pbxFile = require('./pbxFile');
const fs = require('fs');
const parser = require('./parser/pbxproj');
const plist = require('simple-plist');
const COMMENT_KEY = /_comment$/;

function pbxProject (filename) {
    if (!(this instanceof pbxProject)) { return new pbxProject(filename); }

    this.filepath = path.resolve(filename);
}

util.inherits(pbxProject, EventEmitter);

pbxProject.prototype.parse = function (cb) {
    const worker = fork(path.join(`${__dirname}/parseJob.js`), [this.filepath]);

    worker.on('message', msg => {
        if (msg.name === 'SyntaxError' || msg.code) {
            this.emit('error', msg);
        } else {
            this.hash = msg;
            this.emit('end', null, msg);
        }
    });

    if (cb) {
        this.on('error', cb);
        this.on('end', cb);
    }

    return this;
};

pbxProject.prototype.parseSync = function () {
    const file_contents = fs.readFileSync(this.filepath, 'utf-8');

    this.hash = parser.parse(file_contents);
    return this;
};

pbxProject.prototype.writeSync = function (options) {
    this.writer = new pbxWriter(this.hash, options);
    return this.writer.writeSync();
};

pbxProject.prototype.allUuids = function () {
    const sections = this.hash.project.objects;
    let uuids = [];
    let section;

    for (const key in sections) {
        section = sections[key];
        uuids = uuids.concat(Object.keys(section));
    }

    uuids = uuids.filter(str => !COMMENT_KEY.test(str) && str.length === 24);

    return uuids;
};

pbxProject.prototype.generateUuid = function () {
    const id = uuid.v4()
        .replace(/-/g, '')
        .substr(0, 24)
        .toUpperCase();

    if (this.allUuids().includes(id)) {
        return this.generateUuid();
    } else {
        return id;
    }
};

pbxProject.prototype.addPluginFile = function (path, opt) {
    const file = new pbxFile(path, opt);

    file.plugin = true; // durr
    correctForPluginsPath(file, this);

    // null is better for early errors
    if (this.hasFile(file.path)) return null;

    file.fileRef = this.generateUuid();

    this.addToPbxFileReferenceSection(file); // PBXFileReference
    this.addToPluginsPbxGroup(file); // PBXGroup

    return file;
};

pbxProject.prototype.removePluginFile = function (path, opt) {
    const file = new pbxFile(path, opt);
    correctForPluginsPath(file, this);

    this.removeFromPbxFileReferenceSection(file); // PBXFileReference
    this.removeFromPluginsPbxGroup(file); // PBXGroup

    return file;
};

pbxProject.prototype.addProductFile = function (targetPath, opt) {
    const file = new pbxFile(targetPath, opt);

    file.includeInIndex = 0;
    file.fileRef = this.generateUuid();
    file.target = opt ? opt.target : undefined;
    file.group = opt ? opt.group : undefined;
    file.uuid = this.generateUuid();
    file.path = file.basename;

    this.addToPbxFileReferenceSection(file);
    this.addToProductsPbxGroup(file); // PBXGroup

    return file;
};

pbxProject.prototype.removeProductFile = function (path, opt) {
    const file = new pbxFile(path, opt);

    this.removeFromProductsPbxGroup(file); // PBXGroup

    return file;
};

/**
 *
 * @param path {String}
 * @param opt {Object} see pbxFile for avail options
 * @param group {String} group key
 * @returns {Object} file; see pbxFile
 */
pbxProject.prototype.addSourceFile = function (path, opt, group) {
    let file;
    if (group) {
        file = this.addFile(path, group, opt);
    } else {
        file = this.addPluginFile(path, opt);
    }

    if (!file) return false;

    file.target = opt ? opt.target : undefined;
    file.uuid = this.generateUuid();

    this.addToPbxBuildFileSection(file); // PBXBuildFile
    this.addToPbxSourcesBuildPhase(file); // PBXSourcesBuildPhase

    return file;
};

/**
 *
 * @param path {String}
 * @param opt {Object} see pbxFile for avail options
 * @param group {String} group key
 * @returns {Object} file; see pbxFile
 */
pbxProject.prototype.removeSourceFile = function (path, opt, group) {
    let file;
    if (group) {
        file = this.removeFile(path, group, opt);
    } else {
        file = this.removePluginFile(path, opt);
    }
    file.target = opt ? opt.target : undefined;
    this.removeFromPbxBuildFileSection(file); // PBXBuildFile
    this.removeFromPbxSourcesBuildPhase(file); // PBXSourcesBuildPhase

    return file;
};

/**
 *
 * @param path {String}
 * @param opt {Object} see pbxFile for avail options
 * @param group {String} group key
 * @returns {Object} file; see pbxFile
 */
pbxProject.prototype.addHeaderFile = function (path, opt, group) {
    if (group) {
        return this.addFile(path, group, opt);
    } else {
        return this.addPluginFile(path, opt);
    }
};

/**
 *
 * @param path {String}
 * @param opt {Object} see pbxFile for avail options
 * @param group {String} group key
 * @returns {Object} file; see pbxFile
 */
pbxProject.prototype.removeHeaderFile = function (path, opt, group) {
    if (group) {
        return this.removeFile(path, group, opt);
    } else {
        return this.removePluginFile(path, opt);
    }
};

/**
 *
 * @param path {String}
 * @param opt {Object} see pbxFile for avail options
 * @param group {String} group key
 * @returns {Object} file; see pbxFile
 */
pbxProject.prototype.addResourceFile = function (path, opt = {}, group) {
    let file;

    if (opt.plugin) {
        file = this.addPluginFile(path, opt);
        if (!file) return false;
    } else {
        file = new pbxFile(path, opt);
        if (this.hasFile(file.path)) return false;
    }

    file.uuid = this.generateUuid();
    file.target = opt ? opt.target : undefined;

    if (!opt.plugin) {
        correctForResourcesPath(file, this);
        file.fileRef = this.generateUuid();
    }

    if (!opt.variantGroup) {
        this.addToPbxBuildFileSection(file); // PBXBuildFile
        this.addToPbxResourcesBuildPhase(file); // PBXResourcesBuildPhase
    }

    if (!opt.plugin) {
        this.addToPbxFileReferenceSection(file); // PBXFileReference
        if (group) {
            if (this.getPBXGroupByKey(group)) {
                this.addToPbxGroup(file, group); // Group other than Resources (i.e. 'splash')
            } else if (this.getPBXVariantGroupByKey(group)) {
                this.addToPbxVariantGroup(file, group); // PBXVariantGroup
            }
        } else {
            this.addToResourcesPbxGroup(file); // PBXGroup
        }
    }

    return file;
};

/**
 *
 * @param path {String}
 * @param opt {Object} see pbxFile for avail options
 * @param group {String} group key
 * @returns {Object} file; see pbxFile
 */
pbxProject.prototype.removeResourceFile = function (path, opt, group) {
    const file = new pbxFile(path, opt);
    file.target = opt ? opt.target : undefined;

    correctForResourcesPath(file, this);

    this.removeFromPbxBuildFileSection(file); // PBXBuildFile
    this.removeFromPbxFileReferenceSection(file); // PBXFileReference
    if (group) {
        if (this.getPBXGroupByKey(group)) {
            this.removeFromPbxGroup(file, group); // Group other than Resources (i.e. 'splash')
        } else if (this.getPBXVariantGroupByKey(group)) {
            this.removeFromPbxVariantGroup(file, group); // PBXVariantGroup
        }
    } else {
        this.removeFromResourcesPbxGroup(file); // PBXGroup
    }
    this.removeFromPbxResourcesBuildPhase(file); // PBXResourcesBuildPhase

    return file;
};

pbxProject.prototype.addFramework = function (fpath, opt) {
    const customFramework = opt && opt.customFramework === true;
    const link = !opt || (opt.link === undefined || opt.link); // defaults to true if not specified
    const embed = opt && opt.embed; // defaults to false if not specified

    if (opt) {
        delete opt.embed;
    }

    const file = new pbxFile(fpath, opt);

    file.uuid = this.generateUuid();
    file.fileRef = this.generateUuid();
    file.target = opt ? opt.target : undefined;

    if (this.hasFile(file.path)) return false;

    this.addToPbxBuildFileSection(file); // PBXBuildFile
    this.addToPbxFileReferenceSection(file); // PBXFileReference
    this.addToFrameworksPbxGroup(file); // PBXGroup

    if (link) {
        this.addToPbxFrameworksBuildPhase(file); // PBXFrameworksBuildPhase
    }

    if (customFramework) {
        this.addToFrameworkSearchPaths(file);

        if (embed) {
            opt.embed = embed;
            const embeddedFile = new pbxFile(fpath, opt);

            embeddedFile.uuid = this.generateUuid();
            embeddedFile.fileRef = file.fileRef;

            // keeping a separate PBXBuildFile entry for Embed Frameworks
            this.addToPbxBuildFileSection(embeddedFile); // PBXBuildFile

            this.addToPbxEmbedFrameworksBuildPhase(embeddedFile); // PBXCopyFilesBuildPhase

            return embeddedFile;
        }
    }

    return file;
};

pbxProject.prototype.removeFramework = function (fpath, opt) {
    if (opt) {
        delete opt.embed;
    }

    const file = new pbxFile(fpath, opt);
    file.target = opt ? opt.target : undefined;

    this.removeFromPbxBuildFileSection(file); // PBXBuildFile
    this.removeFromPbxFileReferenceSection(file); // PBXFileReference
    this.removeFromFrameworksPbxGroup(file); // PBXGroup
    this.removeFromPbxFrameworksBuildPhase(file); // PBXFrameworksBuildPhase

    if (opt && opt.customFramework) {
        this.removeFromFrameworkSearchPaths(file);
    }

    opt = opt || {};
    opt.embed = true;
    const embeddedFile = new pbxFile(fpath, opt);

    embeddedFile.fileRef = file.fileRef;

    this.removeFromPbxBuildFileSection(embeddedFile); // PBXBuildFile
    this.removeFromPbxEmbedFrameworksBuildPhase(embeddedFile); // PBXCopyFilesBuildPhase

    return file;
};

pbxProject.prototype.addCopyfile = function (fpath, opt) {
    let file = new pbxFile(fpath, opt);

    // catch duplicates
    if (this.hasFile(file.path)) {
        file = this.hasFile(file.path);
    }

    file.fileRef = file.uuid = this.generateUuid();
    file.target = opt ? opt.target : undefined;

    this.addToPbxBuildFileSection(file); // PBXBuildFile
    this.addToPbxFileReferenceSection(file); // PBXFileReference
    this.addToPbxCopyfilesBuildPhase(file); // PBXCopyFilesBuildPhase

    return file;
};

pbxProject.prototype.pbxCopyfilesBuildPhaseObj = function (target) {
    return this.buildPhaseObject('PBXCopyFilesBuildPhase', 'Copy Files', target);
};

pbxProject.prototype.addToPbxCopyfilesBuildPhase = function (file) {
    const sources = this.buildPhaseObject('PBXCopyFilesBuildPhase', 'Copy Files', file.target);
    sources.files.push(pbxBuildPhaseObj(file));
};

pbxProject.prototype.removeCopyfile = function (fpath, opt) {
    const file = new pbxFile(fpath, opt);
    file.target = opt ? opt.target : undefined;

    this.removeFromPbxBuildFileSection(file); // PBXBuildFile
    this.removeFromPbxFileReferenceSection(file); // PBXFileReference
    this.removeFromPbxCopyfilesBuildPhase(file); // PBXFrameworksBuildPhase

    return file;
};

pbxProject.prototype.removeFromPbxCopyfilesBuildPhase = function (file) {
    const sources = this.pbxCopyfilesBuildPhaseObj(file.target);
    for (const i in sources.files) {
        if (sources.files[i].comment === longComment(file)) {
            sources.files.splice(i, 1);
            break;
        }
    }
};

pbxProject.prototype.addStaticLibrary = function (path, opt = {}) {
    let file;

    if (opt.plugin) {
        file = this.addPluginFile(path, opt);
        if (!file) return false;
    } else {
        file = new pbxFile(path, opt);
        if (this.hasFile(file.path)) return false;
    }

    file.uuid = this.generateUuid();
    file.target = opt ? opt.target : undefined;

    if (!opt.plugin) {
        file.fileRef = this.generateUuid();
        this.addToPbxFileReferenceSection(file); // PBXFileReference
    }

    this.addToPbxBuildFileSection(file); // PBXBuildFile
    this.addToPbxFrameworksBuildPhase(file); // PBXFrameworksBuildPhase
    this.addToLibrarySearchPaths(file); // make sure it gets built!

    return file;
};

// helper addition functions
pbxProject.prototype.addToPbxBuildFileSection = function (file) {
    const commentKey = f('%s_comment', file.uuid);

    this.pbxBuildFileSection()[file.uuid] = pbxBuildFileObj(file);
    this.pbxBuildFileSection()[commentKey] = pbxBuildFileComment(file);
};

pbxProject.prototype.removeFromPbxBuildFileSection = function (file) {
    let uuid;

    for (uuid in this.pbxBuildFileSection()) {
        if (this.pbxBuildFileSection()[uuid].fileRef_comment === file.basename) {
            file.uuid = uuid;
            delete this.pbxBuildFileSection()[uuid];

            const commentKey = f('%s_comment', uuid);
            delete this.pbxBuildFileSection()[commentKey];
        }
    }
};

pbxProject.prototype.addPbxGroup = function (filePathsArray, name, path, sourceTree) {
    const groups = this.hash.project.objects.PBXGroup;
    const pbxGroupUuid = this.generateUuid();
    const commentKey = f('%s_comment', pbxGroupUuid);

    const pbxGroup = {
        isa: 'PBXGroup',
        children: [],
        name,
        path,
        sourceTree: sourceTree || '"<group>"'
    };

    const fileReferenceSection = this.pbxFileReferenceSection();
    const filePathToReference = {};

    for (const key in fileReferenceSection) {
        // only look for comments
        if (!COMMENT_KEY.test(key)) continue;

        const fileReferenceKey = key.split(COMMENT_KEY)[0];
        const fileReference = fileReferenceSection[fileReferenceKey];

        filePathToReference[fileReference.path] = { fileRef: fileReferenceKey, basename: fileReferenceSection[key] };
    }

    for (const filePath of filePathsArray) {
        const filePathQuoted = `"${filePath}"`;
        if (filePathToReference[filePath]) {
            pbxGroup.children.push(pbxGroupChild(filePathToReference[filePath]));
            continue;
        } else if (filePathToReference[filePathQuoted]) {
            pbxGroup.children.push(pbxGroupChild(filePathToReference[filePathQuoted]));
            continue;
        }

        const file = new pbxFile(filePath);
        file.uuid = this.generateUuid();
        file.fileRef = this.generateUuid();
        this.addToPbxFileReferenceSection(file); // PBXFileReference
        this.addToPbxBuildFileSection(file); // PBXBuildFile
        pbxGroup.children.push(pbxGroupChild(file));
    }

    if (groups) {
        groups[pbxGroupUuid] = pbxGroup;
        groups[commentKey] = name;
    }

    return { uuid: pbxGroupUuid, pbxGroup };
};

pbxProject.prototype.removePbxGroup = function (groupName) {
    const section = this.hash.project.objects.PBXGroup;
    let key;
    let itemKey;

    for (key in section) {
        // only look for comments
        if (!COMMENT_KEY.test(key)) continue;

        if (section[key] === groupName) {
            itemKey = key.split(COMMENT_KEY)[0];
            delete section[itemKey];
        }
    }
};

pbxProject.prototype.addToPbxProjectSection = function (target) {
    const newTarget = {
        value: target.uuid,
        comment: pbxNativeTargetComment(target.pbxNativeTarget)
    };

    this.pbxProjectSection()[this.getFirstProject().uuid].targets.push(newTarget);
};

pbxProject.prototype.addToPbxNativeTargetSection = function (target) {
    const commentKey = f('%s_comment', target.uuid);

    this.pbxNativeTargetSection()[target.uuid] = target.pbxNativeTarget;
    this.pbxNativeTargetSection()[commentKey] = target.pbxNativeTarget.name;
};

pbxProject.prototype.addToPbxFileReferenceSection = function (file) {
    const commentKey = f('%s_comment', file.fileRef);

    this.pbxFileReferenceSection()[file.fileRef] = pbxFileReferenceObj(file);
    this.pbxFileReferenceSection()[commentKey] = pbxFileReferenceComment(file);
};

pbxProject.prototype.removeFromPbxFileReferenceSection = function (file) {
    const refObj = pbxFileReferenceObj(file);
    for (const i in this.pbxFileReferenceSection()) {
        if (this.pbxFileReferenceSection()[i].name === refObj.name ||
            (`"${this.pbxFileReferenceSection()[i].name}"`) === refObj.name ||
            this.pbxFileReferenceSection()[i].path === refObj.path ||
            (`"${this.pbxFileReferenceSection()[i].path}"`) === refObj.path) {
            file.fileRef = file.uuid = i;
            delete this.pbxFileReferenceSection()[i];
            break;
        }
    }
    const commentKey = f('%s_comment', file.fileRef);
    if (this.pbxFileReferenceSection()[commentKey] !== undefined) {
        delete this.pbxFileReferenceSection()[commentKey];
    }

    return file;
};

pbxProject.prototype.addToXcVersionGroupSection = function (file) {
    if (!file.models || !file.currentModel) {
        throw new Error('Cannot create a XCVersionGroup section from not a data model document file');
    }

    const commentKey = f('%s_comment', file.fileRef);

    if (!this.xcVersionGroupSection()[file.fileRef]) {
        this.xcVersionGroupSection()[file.fileRef] = {
            isa: 'XCVersionGroup',
            children: file.models.map(el => el.fileRef),
            currentVersion: file.currentModel.fileRef,
            name: path.basename(file.path),
            path: file.path,
            sourceTree: '"<group>"',
            versionGroupType: 'wrapper.xcdatamodel'
        };
        this.xcVersionGroupSection()[commentKey] = path.basename(file.path);
    }
};

pbxProject.prototype.addToPluginsPbxGroup = function (file) {
    const pluginsGroup = this.pbxGroupByName('Plugins');
    if (!pluginsGroup) {
        this.addPbxGroup([file.path], 'Plugins');
    } else {
        pluginsGroup.children.push(pbxGroupChild(file));
    }
};

pbxProject.prototype.removeFromPluginsPbxGroup = function (file) {
    if (!this.pbxGroupByName('Plugins')) {
        return null;
    }
    const pluginsGroupChildren = this.pbxGroupByName('Plugins').children;
    for (const i in pluginsGroupChildren) {
        if (pbxGroupChild(file).value === pluginsGroupChildren[i].value &&
            pbxGroupChild(file).comment === pluginsGroupChildren[i].comment) {
            pluginsGroupChildren.splice(i, 1);
            break;
        }
    }
};

pbxProject.prototype.addToResourcesPbxGroup = function (file) {
    const pluginsGroup = this.pbxGroupByName('Resources');
    if (!pluginsGroup) {
        this.addPbxGroup([file.path], 'Resources');
    } else {
        pluginsGroup.children.push(pbxGroupChild(file));
    }
};

pbxProject.prototype.removeFromResourcesPbxGroup = function (file) {
    if (!this.pbxGroupByName('Resources')) {
        return null;
    }
    const pluginsGroupChildren = this.pbxGroupByName('Resources').children;
    for (const i in pluginsGroupChildren) {
        if (pbxGroupChild(file).value === pluginsGroupChildren[i].value &&
            pbxGroupChild(file).comment === pluginsGroupChildren[i].comment) {
            pluginsGroupChildren.splice(i, 1);
            break;
        }
    }
};

pbxProject.prototype.addToFrameworksPbxGroup = function (file) {
    const pluginsGroup = this.pbxGroupByName('Frameworks');
    if (!pluginsGroup) {
        this.addPbxGroup([file.path], 'Frameworks');
    } else {
        pluginsGroup.children.push(pbxGroupChild(file));
    }
};

pbxProject.prototype.removeFromFrameworksPbxGroup = function (file) {
    if (!this.pbxGroupByName('Frameworks')) {
        return null;
    }
    const pluginsGroupChildren = this.pbxGroupByName('Frameworks').children;

    for (const i in pluginsGroupChildren) {
        if (pbxGroupChild(file).value === pluginsGroupChildren[i].value &&
            pbxGroupChild(file).comment === pluginsGroupChildren[i].comment) {
            pluginsGroupChildren.splice(i, 1);
            break;
        }
    }
};

pbxProject.prototype.addToPbxEmbedFrameworksBuildPhase = function (file) {
    const sources = this.pbxEmbedFrameworksBuildPhaseObj(file.target);
    if (sources) {
        sources.files.push(pbxBuildPhaseObj(file));
    }
};

pbxProject.prototype.removeFromPbxEmbedFrameworksBuildPhase = function (file) {
    const sources = this.pbxEmbedFrameworksBuildPhaseObj(file.target);
    if (sources) {
        const files = [];
        for (const i in sources.files) {
            if (sources.files[i].comment !== longComment(file)) {
                files.push(sources.files[i]);
            }
        }
        sources.files = files;
    }
};

pbxProject.prototype.addToProductsPbxGroup = function (file) {
    const productsGroup = this.pbxGroupByName('Products');
    if (!productsGroup) {
        this.addPbxGroup([file.path], 'Products');
    } else {
        productsGroup.children.push(pbxGroupChild(file));
    }
};

pbxProject.prototype.removeFromProductsPbxGroup = function (file) {
    if (!this.pbxGroupByName('Products')) {
        return null;
    }
    const productsGroupChildren = this.pbxGroupByName('Products').children;
    for (const i in productsGroupChildren) {
        if (pbxGroupChild(file).value === productsGroupChildren[i].value &&
            pbxGroupChild(file).comment === productsGroupChildren[i].comment) {
            productsGroupChildren.splice(i, 1);
            break;
        }
    }
};

pbxProject.prototype.addToPbxSourcesBuildPhase = function (file) {
    const sources = this.pbxSourcesBuildPhaseObj(file.target);
    sources.files.push(pbxBuildPhaseObj(file));
};

pbxProject.prototype.removeFromPbxSourcesBuildPhase = function (file) {
    const sources = this.pbxSourcesBuildPhaseObj(file.target);
    for (const i in sources.files) {
        if (sources.files[i].comment === longComment(file)) {
            sources.files.splice(i, 1);
            break;
        }
    }
};

pbxProject.prototype.addToPbxResourcesBuildPhase = function (file) {
    const sources = this.pbxResourcesBuildPhaseObj(file.target);
    sources.files.push(pbxBuildPhaseObj(file));
};

pbxProject.prototype.removeFromPbxResourcesBuildPhase = function (file) {
    const sources = this.pbxResourcesBuildPhaseObj(file.target);

    for (const i in sources.files) {
        if (sources.files[i].comment === longComment(file)) {
            sources.files.splice(i, 1);
            break;
        }
    }
};

pbxProject.prototype.addToPbxFrameworksBuildPhase = function (file) {
    const sources = this.pbxFrameworksBuildPhaseObj(file.target);
    sources.files.push(pbxBuildPhaseObj(file));
};

pbxProject.prototype.removeFromPbxFrameworksBuildPhase = function (file) {
    const sources = this.pbxFrameworksBuildPhaseObj(file.target);
    for (const i in sources.files) {
        if (sources.files[i].comment === longComment(file)) {
            sources.files.splice(i, 1);
            break;
        }
    }
};

pbxProject.prototype.addXCConfigurationList = function (configurationObjectsArray, defaultConfigurationName, comment) {
    const pbxBuildConfigurationSection = this.pbxXCBuildConfigurationSection();
    const pbxXCConfigurationListSection = this.pbxXCConfigurationList();
    const xcConfigurationListUuid = this.generateUuid();
    const commentKey = f('%s_comment', xcConfigurationListUuid);

    const xcConfigurationList = {
        isa: 'XCConfigurationList',
        buildConfigurations: [],
        defaultConfigurationIsVisible: 0,
        defaultConfigurationName
    };

    for (const configuration of configurationObjectsArray) {
        const configurationUuid = this.generateUuid();
        const configurationCommentKey = f('%s_comment', configurationUuid);

        pbxBuildConfigurationSection[configurationUuid] = configuration;
        pbxBuildConfigurationSection[configurationCommentKey] = configuration.name;
        xcConfigurationList.buildConfigurations.push({ value: configurationUuid, comment: configuration.name });
    }

    if (pbxXCConfigurationListSection) {
        pbxXCConfigurationListSection[xcConfigurationListUuid] = xcConfigurationList;
        pbxXCConfigurationListSection[commentKey] = comment;
    }

    return { uuid: xcConfigurationListUuid, xcConfigurationList };
};

pbxProject.prototype.addTargetDependency = function (target, dependencyTargets) {
    if (!target) { return undefined; }

    const nativeTargets = this.pbxNativeTargetSection();

    if (typeof nativeTargets[target] === 'undefined') { throw new Error(`Invalid target: ${target}`); }

    for (const dependencyTarget of dependencyTargets) {
        if (typeof nativeTargets[dependencyTarget] === 'undefined') { throw new Error(`Invalid target: ${dependencyTarget}`); }
    }

    const pbxTargetDependency = 'PBXTargetDependency';
    const pbxContainerItemProxy = 'PBXContainerItemProxy';
    const pbxTargetDependencySection = this.hash.project.objects[pbxTargetDependency];
    const pbxContainerItemProxySection = this.hash.project.objects[pbxContainerItemProxy];

    for (const dependencyTargetUuid of dependencyTargets) {
        const dependencyTargetCommentKey = f('%s_comment', dependencyTargetUuid);
        const targetDependencyUuid = this.generateUuid();
        const targetDependencyCommentKey = f('%s_comment', targetDependencyUuid);
        const itemProxyUuid = this.generateUuid();
        const itemProxyCommentKey = f('%s_comment', itemProxyUuid);

        const itemProxy = {
            isa: pbxContainerItemProxy,
            containerPortal: this.hash.project.rootObject,
            containerPortal_comment: this.hash.project.rootObject_comment,
            proxyType: 1,
            remoteGlobalIDString: dependencyTargetUuid,
            remoteInfo: nativeTargets[dependencyTargetUuid].name
        };

        const targetDependency = {
            isa: pbxTargetDependency,
            target: dependencyTargetUuid,
            target_comment: nativeTargets[dependencyTargetCommentKey],
            targetProxy: itemProxyUuid,
            targetProxy_comment: pbxContainerItemProxy
        };

        if (pbxContainerItemProxySection && pbxTargetDependencySection) {
            pbxContainerItemProxySection[itemProxyUuid] = itemProxy;
            pbxContainerItemProxySection[itemProxyCommentKey] = pbxContainerItemProxy;
            pbxTargetDependencySection[targetDependencyUuid] = targetDependency;
            pbxTargetDependencySection[targetDependencyCommentKey] = pbxTargetDependency;
            nativeTargets[target].dependencies.push({ value: targetDependencyUuid, comment: pbxTargetDependency });
        }
    }

    return { uuid: target, target: nativeTargets[target] };
};

pbxProject.prototype.addBuildPhase = function (filePathsArray, buildPhaseType, comment, target, optionsOrFolderType, subfolderPath) {
    let buildPhaseSection;
    const fileReferenceSection = this.pbxFileReferenceSection();
    const buildFileSection = this.pbxBuildFileSection();
    const buildPhaseUuid = this.generateUuid();
    const buildPhaseTargetUuid = target || this.getFirstTarget().uuid;
    const commentKey = f('%s_comment', buildPhaseUuid);

    let buildPhase = {
        isa: buildPhaseType,
        buildActionMask: 2147483647,
        files: [],
        runOnlyForDeploymentPostprocessing: 0
    };

    const filePathToBuildFile = {};

    if (buildPhaseType === 'PBXCopyFilesBuildPhase') {
        buildPhase = pbxCopyFilesBuildPhaseObj(buildPhase, optionsOrFolderType, subfolderPath, comment);
    } else if (buildPhaseType === 'PBXShellScriptBuildPhase') {
        buildPhase = pbxShellScriptBuildPhaseObj(buildPhase, optionsOrFolderType, comment);
    }

    if (!this.hash.project.objects[buildPhaseType]) {
        this.hash.project.objects[buildPhaseType] = {};
    }

    if (!this.hash.project.objects[buildPhaseType][buildPhaseUuid]) {
        this.hash.project.objects[buildPhaseType][buildPhaseUuid] = buildPhase;
        this.hash.project.objects[buildPhaseType][commentKey] = comment;
    }

    if (this.hash.project.objects.PBXNativeTarget[buildPhaseTargetUuid].buildPhases) {
        this.hash.project.objects.PBXNativeTarget[buildPhaseTargetUuid].buildPhases.push({
            value: buildPhaseUuid,
            comment
        });
    }

    for (const key in buildFileSection) {
        // only look for comments
        if (!COMMENT_KEY.test(key)) continue;

        const buildFileKey = key.split(COMMENT_KEY)[0];
        const buildFile = buildFileSection[buildFileKey];
        const fileReference = fileReferenceSection[buildFile.fileRef];

        if (!fileReference) continue;

        const pbxFileObj = new pbxFile(fileReference.path);

        filePathToBuildFile[fileReference.path] = { uuid: buildFileKey, basename: pbxFileObj.basename, group: pbxFileObj.group };
    }

    for (const filePath of filePathsArray) {
        const filePathQuoted = `"${filePath}"`;
        const file = new pbxFile(filePath);

        if (filePathToBuildFile[filePath]) {
            buildPhase.files.push(pbxBuildPhaseObj(filePathToBuildFile[filePath]));
            continue;
        } else if (filePathToBuildFile[filePathQuoted]) {
            buildPhase.files.push(pbxBuildPhaseObj(filePathToBuildFile[filePathQuoted]));
            continue;
        }

        file.uuid = this.generateUuid();
        file.fileRef = this.generateUuid();
        this.addToPbxFileReferenceSection(file); // PBXFileReference
        this.addToPbxBuildFileSection(file); // PBXBuildFile
        buildPhase.files.push(pbxBuildPhaseObj(file));
    }

    if (buildPhaseSection) {
        buildPhaseSection[buildPhaseUuid] = buildPhase;
        buildPhaseSection[commentKey] = comment;
    }

    return { uuid: buildPhaseUuid, buildPhase };
};

// helper access functions
pbxProject.prototype.pbxProjectSection = function () {
    return this.hash.project.objects.PBXProject;
};
pbxProject.prototype.pbxBuildFileSection = function () {
    return this.hash.project.objects.PBXBuildFile;
};

pbxProject.prototype.pbxXCBuildConfigurationSection = function () {
    return this.hash.project.objects.XCBuildConfiguration;
};

pbxProject.prototype.pbxFileReferenceSection = function () {
    return this.hash.project.objects.PBXFileReference;
};

pbxProject.prototype.pbxNativeTargetSection = function () {
    return this.hash.project.objects.PBXNativeTarget;
};

pbxProject.prototype.xcVersionGroupSection = function () {
    if (typeof this.hash.project.objects.XCVersionGroup !== 'object') {
        this.hash.project.objects.XCVersionGroup = {};
    }

    return this.hash.project.objects.XCVersionGroup;
};

pbxProject.prototype.pbxXCConfigurationList = function () {
    return this.hash.project.objects.XCConfigurationList;
};

pbxProject.prototype.pbxGroupByName = function (name) {
    const groups = this.hash.project.objects.PBXGroup;
    let key;
    let groupKey;

    for (key in groups) {
        // only look for comments
        if (!COMMENT_KEY.test(key)) continue;

        if (groups[key] === name) {
            groupKey = key.split(COMMENT_KEY)[0];
            return groups[groupKey];
        }
    }

    return null;
};

pbxProject.prototype.pbxTargetByName = function (name) {
    return this.pbxItemByComment(name, 'PBXNativeTarget');
};

pbxProject.prototype.findTargetKey = function (name) {
    const targets = this.hash.project.objects.PBXNativeTarget;

    for (const key in targets) {
        // only look for comments
        if (COMMENT_KEY.test(key)) continue;

        const target = targets[key];
        if (target.name === name) {
            return key;
        }
    }

    return null;
};

pbxProject.prototype.pbxItemByComment = function (name, pbxSectionName) {
    const section = this.hash.project.objects[pbxSectionName];
    let key;
    let itemKey;

    for (key in section) {
        // only look for comments
        if (!COMMENT_KEY.test(key)) continue;

        if (section[key] === name) {
            itemKey = key.split(COMMENT_KEY)[0];
            return section[itemKey];
        }
    }

    return null;
};

pbxProject.prototype.pbxSourcesBuildPhaseObj = function (target) {
    return this.buildPhaseObject('PBXSourcesBuildPhase', 'Sources', target);
};

pbxProject.prototype.pbxResourcesBuildPhaseObj = function (target) {
    return this.buildPhaseObject('PBXResourcesBuildPhase', 'Resources', target);
};

pbxProject.prototype.pbxFrameworksBuildPhaseObj = function (target) {
    return this.buildPhaseObject('PBXFrameworksBuildPhase', 'Frameworks', target);
};

pbxProject.prototype.pbxEmbedFrameworksBuildPhaseObj = function (target) {
    return this.buildPhaseObject('PBXCopyFilesBuildPhase', 'Embed Frameworks', target);
};

// Find Build Phase from group/target
pbxProject.prototype.buildPhase = function (group, target) {
    if (!target) { return undefined; }

    const nativeTargets = this.pbxNativeTargetSection();
    if (typeof nativeTargets[target] === 'undefined') { throw new Error(`Invalid target: ${target}`); }

    const nativeTarget = nativeTargets[target];
    const buildPhases = nativeTarget.buildPhases;
    for (const i in buildPhases) {
        const buildPhase = buildPhases[i];
        if (buildPhase.comment === group) { return `${buildPhase.value}_comment`; }
    }
};

pbxProject.prototype.buildPhaseObject = function (name, group, target) {
    const section = this.hash.project.objects[name];
    let sectionKey;
    let key;
    const buildPhase = this.buildPhase(group, target);

    for (key in section) {
        // only look for comments
        if (!COMMENT_KEY.test(key)) continue;

        // select the proper buildPhase
        if (buildPhase && buildPhase !== key) { continue; }
        if (section[key] === group) {
            sectionKey = key.split(COMMENT_KEY)[0];
            return section[sectionKey];
        }
    }
    return null;
};

pbxProject.prototype.addBuildProperty = function (prop, value, build_name) {
    const configurations = nonComments(this.pbxXCBuildConfigurationSection());
    let key;
    let configuration;

    for (key in configurations) {
        configuration = configurations[key];
        if (!build_name || configuration.name === build_name) {
            configuration.buildSettings[prop] = value;
        }
    }
};

pbxProject.prototype.removeBuildProperty = function (prop, build_name) {
    const configurations = nonComments(this.pbxXCBuildConfigurationSection());
    let key;
    let configuration;

    for (key in configurations) {
        configuration = configurations[key];
        if ((configuration.buildSettings[prop] && !build_name) || configuration.name === build_name) {
            delete configuration.buildSettings[prop];
        }
    }
};

/**
 *
 * @param prop {String}
 * @param value {String|Array|Object|Number|Boolean}
 * @param build {String} Release or Debug
 */
pbxProject.prototype.updateBuildProperty = function (prop, value, build) {
    const configs = this.pbxXCBuildConfigurationSection();
    for (const configName in configs) {
        if (!COMMENT_KEY.test(configName)) {
            const config = configs[configName];
            if ((build && config.name === build) || (!build)) {
                config.buildSettings[prop] = value;
            }
        }
    }
};

pbxProject.prototype.updateProductName = function (name) {
    this.updateBuildProperty('PRODUCT_NAME', `"${name}"`);
};

pbxProject.prototype.removeFromFrameworkSearchPaths = function (file) {
    const configurations = nonComments(this.pbxXCBuildConfigurationSection());
    const SEARCH_PATHS = 'FRAMEWORK_SEARCH_PATHS';
    let config;
    let buildSettings;
    let searchPaths;
    const new_path = searchPathForFile(file, this);

    for (config in configurations) {
        buildSettings = configurations[config].buildSettings;

        if (unquote(buildSettings.PRODUCT_NAME) !== this.productName) { continue; }

        searchPaths = buildSettings[SEARCH_PATHS];

        if (searchPaths && Array.isArray(searchPaths)) {
            const matches = searchPaths.filter(p => p.includes(new_path));
            matches.forEach(m => {
                const idx = searchPaths.indexOf(m);
                searchPaths.splice(idx, 1);
            });
        }
    }
};

pbxProject.prototype.addToFrameworkSearchPaths = function (file) {
    const configurations = nonComments(this.pbxXCBuildConfigurationSection());
    const INHERITED = '"$(inherited)"';
    let config;
    let buildSettings;

    for (config in configurations) {
        buildSettings = configurations[config].buildSettings;

        if (unquote(buildSettings.PRODUCT_NAME) !== this.productName) { continue; }

        if (!buildSettings.FRAMEWORK_SEARCH_PATHS ||
            buildSettings.FRAMEWORK_SEARCH_PATHS === INHERITED) {
            buildSettings.FRAMEWORK_SEARCH_PATHS = [INHERITED];
        }

        buildSettings.FRAMEWORK_SEARCH_PATHS.push(searchPathForFile(file, this));
    }
};

pbxProject.prototype.removeFromLibrarySearchPaths = function (file) {
    const configurations = nonComments(this.pbxXCBuildConfigurationSection());
    const SEARCH_PATHS = 'LIBRARY_SEARCH_PATHS';
    let config;
    let buildSettings;
    let searchPaths;
    const new_path = searchPathForFile(file, this);

    for (config in configurations) {
        buildSettings = configurations[config].buildSettings;

        if (unquote(buildSettings.PRODUCT_NAME) !== this.productName) { continue; }

        searchPaths = buildSettings[SEARCH_PATHS];

        if (searchPaths && Array.isArray(searchPaths)) {
            const matches = searchPaths.filter(p => p.includes(new_path));
            matches.forEach(m => {
                const idx = searchPaths.indexOf(m);
                searchPaths.splice(idx, 1);
            });
        }
    }
};

pbxProject.prototype.addToLibrarySearchPaths = function (file) {
    const configurations = nonComments(this.pbxXCBuildConfigurationSection());
    const INHERITED = '"$(inherited)"';
    let config;
    let buildSettings;

    for (config in configurations) {
        buildSettings = configurations[config].buildSettings;

        if (unquote(buildSettings.PRODUCT_NAME) !== this.productName) { continue; }

        if (!buildSettings.LIBRARY_SEARCH_PATHS ||
            buildSettings.LIBRARY_SEARCH_PATHS === INHERITED) {
            buildSettings.LIBRARY_SEARCH_PATHS = [INHERITED];
        }

        if (typeof file === 'string') {
            buildSettings.LIBRARY_SEARCH_PATHS.push(file);
        } else {
            buildSettings.LIBRARY_SEARCH_PATHS.push(searchPathForFile(file, this));
        }
    }
};

pbxProject.prototype.removeFromHeaderSearchPaths = function (file) {
    const configurations = nonComments(this.pbxXCBuildConfigurationSection());
    const SEARCH_PATHS = 'HEADER_SEARCH_PATHS';
    let config;
    let buildSettings;
    const new_path = searchPathForFile(file, this);

    for (config in configurations) {
        buildSettings = configurations[config].buildSettings;

        if (unquote(buildSettings.PRODUCT_NAME) !== this.productName) { continue; }

        if (buildSettings[SEARCH_PATHS]) {
            const matches = buildSettings[SEARCH_PATHS].filter(p => p.includes(new_path));
            matches.forEach(m => {
                const idx = buildSettings[SEARCH_PATHS].indexOf(m);
                buildSettings[SEARCH_PATHS].splice(idx, 1);
            });
        }
    }
};
pbxProject.prototype.addToHeaderSearchPaths = function (file) {
    const configurations = nonComments(this.pbxXCBuildConfigurationSection());
    const INHERITED = '"$(inherited)"';
    let config;
    let buildSettings;

    for (config in configurations) {
        buildSettings = configurations[config].buildSettings;

        if (unquote(buildSettings.PRODUCT_NAME) !== this.productName) { continue; }

        if (!buildSettings.HEADER_SEARCH_PATHS) {
            buildSettings.HEADER_SEARCH_PATHS = [INHERITED];
        }

        if (typeof file === 'string') {
            buildSettings.HEADER_SEARCH_PATHS.push(file);
        } else {
            buildSettings.HEADER_SEARCH_PATHS.push(searchPathForFile(file, this));
        }
    }
};

pbxProject.prototype.addToOtherLinkerFlags = function (flag) {
    const configurations = nonComments(this.pbxXCBuildConfigurationSection());
    const INHERITED = '"$(inherited)"';
    const OTHER_LDFLAGS = 'OTHER_LDFLAGS';
    let config;
    let buildSettings;

    for (config in configurations) {
        buildSettings = configurations[config].buildSettings;

        if (unquote(buildSettings.PRODUCT_NAME) !== this.productName) { continue; }

        if (!buildSettings[OTHER_LDFLAGS] ||
                buildSettings[OTHER_LDFLAGS] === INHERITED) {
            buildSettings[OTHER_LDFLAGS] = [INHERITED];
        }

        buildSettings[OTHER_LDFLAGS].push(flag);
    }
};

pbxProject.prototype.removeFromOtherLinkerFlags = function (flag) {
    const configurations = nonComments(this.pbxXCBuildConfigurationSection());
    const OTHER_LDFLAGS = 'OTHER_LDFLAGS';
    let config;
    let buildSettings;

    for (config in configurations) {
        buildSettings = configurations[config].buildSettings;

        if (unquote(buildSettings.PRODUCT_NAME) !== this.productName) {
            continue;
        }

        if (buildSettings[OTHER_LDFLAGS]) {
            const matches = buildSettings[OTHER_LDFLAGS].filter(p => p.includes(flag));
            matches.forEach(m => {
                const idx = buildSettings[OTHER_LDFLAGS].indexOf(m);
                buildSettings[OTHER_LDFLAGS].splice(idx, 1);
            });
        }
    }
};

pbxProject.prototype.addToBuildSettings = function (buildSetting, value) {
    const configurations = nonComments(this.pbxXCBuildConfigurationSection());
    let config;
    let buildSettings;

    for (config in configurations) {
        buildSettings = configurations[config].buildSettings;

        buildSettings[buildSetting] = value;
    }
};

pbxProject.prototype.removeFromBuildSettings = function (buildSetting) {
    const configurations = nonComments(this.pbxXCBuildConfigurationSection());
    let config;
    let buildSettings;

    for (config in configurations) {
        buildSettings = configurations[config].buildSettings;

        if (buildSettings[buildSetting]) {
            delete buildSettings[buildSetting];
        }
    }
};

// a JS getter. hmmm
pbxProject.prototype.__defineGetter__('productName', function () {
    const configurations = nonComments(this.pbxXCBuildConfigurationSection());
    let config;
    let productName;

    for (config in configurations) {
        productName = configurations[config].buildSettings.PRODUCT_NAME;

        if (productName) {
            return unquote(productName);
        }
    }
});

// check if file is present
pbxProject.prototype.hasFile = function (filePath) {
    const files = nonComments(this.pbxFileReferenceSection());
    let file;

    for (const id in files) {
        file = files[id];
        if (file.path === filePath || file.path === (`"${filePath}"`)) {
            return file;
        }
    }

    return false;
};

pbxProject.prototype.addTarget = function (name, type, subfolder) {
    // Setup uuid and name of new target
    const targetUuid = this.generateUuid();

    const targetType = type;
    const targetSubfolder = subfolder || name;
    const targetName = name.trim();

    // Check type against list of allowed target types
    if (!targetName) {
        throw new Error('Target name missing.');
    }

    // Check type against list of allowed target types
    if (!targetType) {
        throw new Error('Target type missing.');
    }

    // Check type against list of allowed target types
    if (!producttypeForTargettype(targetType)) {
        throw new Error(`Target type invalid: ${targetType}`);
    }

    // Build Configuration: Create
    const buildConfigurationsList = [
        {
            name: 'Debug',
            isa: 'XCBuildConfiguration',
            buildSettings: {
                GCC_PREPROCESSOR_DEFINITIONS: ['"DEBUG=1"', '"$(inherited)"'],
                INFOPLIST_FILE: `"${path.join(targetSubfolder, `${targetSubfolder}-Info.plist"`)}`,
                LD_RUNPATH_SEARCH_PATHS: '"$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks"',
                PRODUCT_NAME: `"${targetName}"`,
                SKIP_INSTALL: 'YES'
            }
        },
        {
            name: 'Release',
            isa: 'XCBuildConfiguration',
            buildSettings: {
                INFOPLIST_FILE: `"${path.join(targetSubfolder, `${targetSubfolder}-Info.plist"`)}`,
                LD_RUNPATH_SEARCH_PATHS: '"$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks"',
                PRODUCT_NAME: `"${targetName}"`,
                SKIP_INSTALL: 'YES'
            }
        }
    ];

    // Build Configuration: Add
    const buildConfigurations = this.addXCConfigurationList(buildConfigurationsList, 'Release', `Build configuration list for PBXNativeTarget "${targetName}"`);

    // Product: Create
    const productName = targetName;

    const productType = producttypeForTargettype(targetType);
    const productFileType = filetypeForProducttype(productType);
    const productFile = this.addProductFile(productName, { group: 'Copy Files', target: targetUuid, explicitFileType: productFileType });

    // Product: Add to build file list
    this.addToPbxBuildFileSection(productFile);

    // Target: Create
    const target = {
        uuid: targetUuid,
        pbxNativeTarget: {
            isa: 'PBXNativeTarget',
            name: `"${targetName}"`,
            productName: `"${targetName}"`,
            productReference: productFile.fileRef,
            productType: `"${producttypeForTargettype(targetType)}"`,
            buildConfigurationList: buildConfigurations.uuid,
            buildPhases: [],
            buildRules: [],
            dependencies: []
        }
    };

    // Target: Add to PBXNativeTarget section
    this.addToPbxNativeTargetSection(target);

    // Product: Embed (only for "extension"-type targets)
    if (targetType === 'app_extension') {
        // Create CopyFiles phase in first target
        this.addBuildPhase([], 'PBXCopyFilesBuildPhase', 'Copy Files', this.getFirstTarget().uuid, targetType);

        // Add product to CopyFiles phase
        this.addToPbxCopyfilesBuildPhase(productFile);

        // this.addBuildPhaseToTarget(newPhase.buildPhase, this.getFirstTarget().uuid)
    } else if (targetType === 'watch2_app') {
        // Create CopyFiles phase in first target
        this.addBuildPhase(
            [`${targetName}.app`],
            'PBXCopyFilesBuildPhase',
            'Embed Watch Content',
            this.getFirstTarget().uuid,
            targetType,
            '"$(CONTENTS_FOLDER_PATH)/Watch"'
        );
    } else if (targetType === 'watch2_extension') {
        // Create CopyFiles phase in watch target (if exists)
        const watch2AppTarget = this.getTarget(producttypeForTargettype('watch2_app'));
        if (watch2AppTarget) {
            this.addBuildPhase(
                [`${targetName}.appex`],
                'PBXCopyFilesBuildPhase',
                'Embed App Extensions',
                watch2AppTarget.uuid,
                targetType
            );
        }
    }

    // Target: Add uuid to root project
    this.addToPbxProjectSection(target);

    // Target: Add dependency for this target to other targets
    if (targetType === 'watch2_extension') {
        const watch2ExtensionTarget = this.getTarget(producttypeForTargettype('watch2_app'));
        if (watch2ExtensionTarget) {
            this.addTargetDependency(watch2ExtensionTarget.uuid, [target.uuid]);
        }
    } else {
        this.addTargetDependency(this.getFirstTarget().uuid, [target.uuid]);
    }

    // Return target on success
    return target;
};

// helper object creation functions
function pbxBuildFileObj (file) {
    const obj = Object.create(null);

    obj.isa = 'PBXBuildFile';
    obj.fileRef = file.fileRef;
    obj.fileRef_comment = file.basename;
    if (file.settings) obj.settings = file.settings;

    return obj;
}

function pbxFileReferenceObj (file) {
    const fileObject = {
        isa: 'PBXFileReference',
        name: `"${file.basename}"`,
        path: `"${file.path.replace(/\\/g, '/')}"`,
        sourceTree: file.sourceTree,
        fileEncoding: file.fileEncoding,
        lastKnownFileType: file.lastKnownFileType,
        explicitFileType: file.explicitFileType,
        includeInIndex: file.includeInIndex
    };

    return fileObject;
}

function pbxGroupChild (file) {
    const obj = Object.create(null);

    obj.value = file.fileRef;
    obj.comment = file.basename;

    return obj;
}

function pbxBuildPhaseObj (file) {
    const obj = Object.create(null);

    obj.value = file.uuid;
    obj.comment = longComment(file);

    return obj;
}

function pbxCopyFilesBuildPhaseObj (obj, folderType, subfolderPath, phaseName) {
    // Add additional properties for 'CopyFiles' build phase
    const DESTINATION_BY_TARGETTYPE = {
        application: 'wrapper',
        app_extension: 'plugins',
        bundle: 'wrapper',
        command_line_tool: 'wrapper',
        dynamic_library: 'products_directory',
        framework: 'shared_frameworks',
        frameworks: 'frameworks',
        static_library: 'products_directory',
        unit_test_bundle: 'wrapper',
        watch_app: 'wrapper',
        watch2_app: 'products_directory',
        watch_extension: 'plugins',
        watch2_extension: 'plugins'
    };
    const SUBFOLDERSPEC_BY_DESTINATION = {
        absolute_path: 0,
        executables: 6,
        frameworks: 10,
        java_resources: 15,
        plugins: 13,
        products_directory: 16,
        resources: 7,
        shared_frameworks: 11,
        shared_support: 12,
        wrapper: 1,
        xpc_services: 0
    };

    obj.name = `"${phaseName}"`;
    obj.dstPath = subfolderPath || '""';
    obj.dstSubfolderSpec = SUBFOLDERSPEC_BY_DESTINATION[DESTINATION_BY_TARGETTYPE[folderType]];

    return obj;
}

function pbxShellScriptBuildPhaseObj (obj, options, phaseName) {
    obj.name = `"${phaseName}"`;
    obj.inputPaths = options.inputPaths || [];
    obj.outputPaths = options.outputPaths || [];
    obj.shellPath = options.shellPath;
    obj.shellScript = `"${options.shellScript.replace(/"/g, '\\"')}"`;

    return obj;
}

function pbxBuildFileComment (file) {
    return longComment(file);
}

function pbxFileReferenceComment (file) {
    return file.basename || path.basename(file.path);
}

function pbxNativeTargetComment (target) {
    return target.name;
}

function longComment (file) {
    return f('%s in %s', file.basename, file.group);
}

// respect <group> path
function correctForPluginsPath (file, project) {
    return correctForPath(file, project, 'Plugins');
}

function correctForResourcesPath (file, project) {
    return correctForPath(file, project, 'Resources');
}

function correctForPath (file, project, group) {
    const r_group_dir = new RegExp(`^${group}[\\\\/]`);

    if (project.pbxGroupByName(group).path) { file.path = file.path.replace(r_group_dir, ''); }

    return file;
}

function searchPathForFile (file, proj) {
    const plugins = proj.pbxGroupByName('Plugins');
    const pluginsPath = plugins ? plugins.path : null;
    let fileDir = path.dirname(file.path);

    if (fileDir === '.') {
        fileDir = '';
    } else {
        fileDir = `/${fileDir}`;
    }

    if (file.plugin && pluginsPath) {
        return `"\\"$(SRCROOT)/${unquote(pluginsPath)}\\""`;
    } else if (file.customFramework && file.dirname) {
        return `"\\"${file.dirname}\\""`;
    } else {
        return `"\\"$(SRCROOT)/${proj.productName}${fileDir}\\""`;
    }
}

function nonComments (obj) {
    const keys = Object.keys(obj);
    const newObj = {};

    for (let i = 0; i < keys.length; i++) {
        if (!COMMENT_KEY.test(keys[i])) {
            newObj[keys[i]] = obj[keys[i]];
        }
    }

    return newObj;
}

function unquote (str) {
    if (str) return str.replace(/^"(.*)"$/, '$1');
}

function producttypeForTargettype (targetType) {
    const PRODUCTTYPE_BY_TARGETTYPE = {
        application: 'com.apple.product-type.application',
        app_extension: 'com.apple.product-type.app-extension',
        bundle: 'com.apple.product-type.bundle',
        command_line_tool: 'com.apple.product-type.tool',
        dynamic_library: 'com.apple.product-type.library.dynamic',
        framework: 'com.apple.product-type.framework',
        static_library: 'com.apple.product-type.library.static',
        unit_test_bundle: 'com.apple.product-type.bundle.unit-test',
        watch_app: 'com.apple.product-type.application.watchapp',
        watch2_app: 'com.apple.product-type.application.watchapp2',
        watch_extension: 'com.apple.product-type.watchkit-extension',
        watch2_extension: 'com.apple.product-type.watchkit2-extension'
    };

    return PRODUCTTYPE_BY_TARGETTYPE[targetType];
}

function filetypeForProducttype (productType) {
    const FILETYPE_BY_PRODUCTTYPE = {
        'com.apple.product-type.application': '"wrapper.application"',
        'com.apple.product-type.app-extension': '"wrapper.app-extension"',
        'com.apple.product-type.bundle': '"wrapper.plug-in"',
        'com.apple.product-type.tool': '"compiled.mach-o.dylib"',
        'com.apple.product-type.library.dynamic': '"compiled.mach-o.dylib"',
        'com.apple.product-type.framework': '"wrapper.framework"',
        'com.apple.product-type.library.static': '"archive.ar"',
        'com.apple.product-type.bundle.unit-test': '"wrapper.cfbundle"',
        'com.apple.product-type.application.watchapp': '"wrapper.application"',
        'com.apple.product-type.application.watchapp2': '"wrapper.application"',
        'com.apple.product-type.watchkit-extension': '"wrapper.app-extension"',
        'com.apple.product-type.watchkit2-extension': '"wrapper.app-extension"'
    };

    return FILETYPE_BY_PRODUCTTYPE[productType];
}

pbxProject.prototype.getFirstProject = function () {
    // Get pbxProject container
    const pbxProjectContainer = this.pbxProjectSection();

    // Get first pbxProject UUID
    const firstProjectUuid = Object.keys(pbxProjectContainer)[0];

    // Get first pbxProject
    const firstProject = pbxProjectContainer[firstProjectUuid];

    return {
        uuid: firstProjectUuid,
        firstProject
    };
};

pbxProject.prototype.getFirstTarget = function () {
    // Get first target's UUID
    const firstTargetUuid = this.getFirstProject().firstProject.targets[0].value;

    // Get first pbxNativeTarget
    const firstTarget = this.pbxNativeTargetSection()[firstTargetUuid];

    return {
        uuid: firstTargetUuid,
        firstTarget
    };
};

pbxProject.prototype.getTarget = function (productType) {
    // Find target by product type
    const targets = this.getFirstProject().firstProject.targets;
    const nativeTargets = this.pbxNativeTargetSection();

    for (const target of targets) {
        const targetUuid = target.value;
        if (nativeTargets[targetUuid].productType === `"${productType}"`) {
            // Get pbxNativeTarget
            const nativeTarget = this.pbxNativeTargetSection()[targetUuid];
            return {
                uuid: targetUuid,
                target: nativeTarget
            };
        }
    }

    return null;
};

/** * NEW ***/

pbxProject.prototype.addToPbxGroupType = function (file, groupKey, groupType) {
    const group = this.getPBXGroupByKeyAndType(groupKey, groupType);
    if (group && group.children !== undefined) {
        if (typeof file === 'string') {
            // Group Key
            const childGroup = {
                value: file
            };
            if (this.getPBXGroupByKey(file)) {
                childGroup.comment = this.getPBXGroupByKey(file).name;
            } else if (this.getPBXVariantGroupByKey(file)) {
                childGroup.comment = this.getPBXVariantGroupByKey(file).name;
            }

            group.children.push(childGroup);
        } else {
            // File Object
            group.children.push(pbxGroupChild(file));
        }
    }
};

pbxProject.prototype.addToPbxVariantGroup = function (file, groupKey) {
    this.addToPbxGroupType(file, groupKey, 'PBXVariantGroup');
};

pbxProject.prototype.addToPbxGroup = function (file, groupKey) {
    this.addToPbxGroupType(file, groupKey, 'PBXGroup');
};

pbxProject.prototype.pbxCreateGroupWithType = function (name, pathName, groupType) {
    // Create object
    const model = {
        isa: `"${groupType}"`,
        children: [],
        name,
        sourceTree: '"<group>"'
    };
    if (pathName) model.path = pathName;
    const key = this.generateUuid();

    // Create comment
    const commendId = `${key}_comment`;

    // add obj and commentObj to groups;
    let groups = this.hash.project.objects[groupType];
    if (!groups) {
        groups = this.hash.project.objects[groupType] = {};
    }
    groups[commendId] = name;
    groups[key] = model;

    return key;
};

pbxProject.prototype.pbxCreateVariantGroup = function (name) {
    return this.pbxCreateGroupWithType(name, undefined, 'PBXVariantGroup');
};

pbxProject.prototype.pbxCreateGroup = function (name, pathName) {
    return this.pbxCreateGroupWithType(name, pathName, 'PBXGroup');
};

pbxProject.prototype.removeFromPbxGroupAndType = function (file, groupKey, groupType) {
    const group = this.getPBXGroupByKeyAndType(groupKey, groupType);
    if (group) {
        const groupChildren = group.children;
        for (const i in groupChildren) {
            if (pbxGroupChild(file).value === groupChildren[i].value &&
                pbxGroupChild(file).comment === groupChildren[i].comment) {
                groupChildren.splice(i, 1);
                break;
            }
        }
    }
};

pbxProject.prototype.removeFromPbxGroup = function (file, groupKey) {
    this.removeFromPbxGroupAndType(file, groupKey, 'PBXGroup');
};

pbxProject.prototype.removeFromPbxVariantGroup = function (file, groupKey) {
    this.removeFromPbxGroupAndType(file, groupKey, 'PBXVariantGroup');
};

pbxProject.prototype.getPBXGroupByKeyAndType = function (key, groupType) {
    return this.hash.project.objects[groupType][key];
};

pbxProject.prototype.getPBXGroupByKey = function (key) {
    return this.hash.project.objects.PBXGroup[key];
};

pbxProject.prototype.getPBXVariantGroupByKey = function (key) {
    return this.hash.project.objects.PBXVariantGroup[key];
};

pbxProject.prototype.findPBXGroupKeyAndType = function (criteria, groupType) {
    const groups = this.hash.project.objects[groupType];
    let target;

    for (const key in groups) {
        // only look for comments
        if (COMMENT_KEY.test(key)) continue;

        const group = groups[key];
        if (criteria && criteria.path && criteria.name) {
            if (criteria.path === group.path && criteria.name === group.name) {
                target = key;
                break;
            }
        } else if (criteria && criteria.path) {
            if (criteria.path === group.path) {
                target = key;
                break;
            }
        } else if (criteria && criteria.name) {
            if (criteria.name === group.name) {
                target = key;
                break;
            }
        }
    }

    return target;
};

pbxProject.prototype.findPBXGroupKey = function (criteria) {
    return this.findPBXGroupKeyAndType(criteria, 'PBXGroup');
};

pbxProject.prototype.findPBXVariantGroupKey = function (criteria) {
    return this.findPBXGroupKeyAndType(criteria, 'PBXVariantGroup');
};

pbxProject.prototype.addLocalizationVariantGroup = function (name) {
    const groupKey = this.pbxCreateVariantGroup(name);

    const resourceGroupKey = this.findPBXGroupKey({ name: 'Resources' });
    this.addToPbxGroup(groupKey, resourceGroupKey);

    const localizationVariantGroup = {
        uuid: this.generateUuid(),
        fileRef: groupKey,
        basename: name
    };
    this.addToPbxBuildFileSection(localizationVariantGroup); // PBXBuildFile
    this.addToPbxResourcesBuildPhase(localizationVariantGroup); // PBXResourcesBuildPhase

    return localizationVariantGroup;
};

pbxProject.prototype.addKnownRegion = function (name) {
    if (!this.pbxProjectSection()[this.getFirstProject().uuid].knownRegions) {
        this.pbxProjectSection()[this.getFirstProject().uuid].knownRegions = [];
    }
    if (!this.hasKnownRegion(name)) {
        this.pbxProjectSection()[this.getFirstProject().uuid].knownRegions.push(name);
    }
};

pbxProject.prototype.removeKnownRegion = function (name) {
    const regions = this.pbxProjectSection()[this.getFirstProject().uuid].knownRegions;
    if (regions) {
        for (let i = 0; i < regions.length; i++) {
            if (regions[i] === name) {
                regions.splice(i, 1);
                break;
            }
        }
        this.pbxProjectSection()[this.getFirstProject().uuid].knownRegions = regions;
    }
};

pbxProject.prototype.hasKnownRegion = function (name) {
    const regions = this.pbxProjectSection()[this.getFirstProject().uuid].knownRegions;
    if (regions) {
        for (const i in regions) {
            if (regions[i] === name) {
                return true;
            }
        }
    }
    return false;
};

pbxProject.prototype.getPBXObject = function (name) {
    return this.hash.project.objects[name];
};

pbxProject.prototype.addFile = function (path, group, opt) {
    const file = new pbxFile(path, opt);

    // null is better for early errors
    if (this.hasFile(file.path)) return null;

    file.fileRef = this.generateUuid();

    this.addToPbxFileReferenceSection(file); // PBXFileReference

    if (this.getPBXGroupByKey(group)) {
        this.addToPbxGroup(file, group); // PBXGroup
    } else if (this.getPBXVariantGroupByKey(group)) {
        this.addToPbxVariantGroup(file, group); // PBXVariantGroup
    }

    return file;
};

pbxProject.prototype.removeFile = function (path, group, opt) {
    const file = new pbxFile(path, opt);

    this.removeFromPbxFileReferenceSection(file); // PBXFileReference

    if (this.getPBXGroupByKey(group)) {
        this.removeFromPbxGroup(file, group); // PBXGroup
    } else if (this.getPBXVariantGroupByKey(group)) {
        this.removeFromPbxVariantGroup(file, group); // PBXVariantGroup
    }

    return file;
};

pbxProject.prototype.getBuildProperty = function (prop, build) {
    let target;
    const configs = this.pbxXCBuildConfigurationSection();
    for (const configName in configs) {
        if (!COMMENT_KEY.test(configName)) {
            const config = configs[configName];
            if ((build && config.name === build) || (build === undefined)) {
                if (config.buildSettings[prop] !== undefined) {
                    target = config.buildSettings[prop];
                }
            }
        }
    }
    return target;
};

pbxProject.prototype.getBuildConfigByName = function (name) {
    const target = {};
    const configs = this.pbxXCBuildConfigurationSection();
    for (const configName in configs) {
        if (!COMMENT_KEY.test(configName)) {
            const config = configs[configName];
            if (config.name === name) {
                target[configName] = config;
            }
        }
    }
    return target;
};

pbxProject.prototype.addDataModelDocument = function (filePath, group, opt) {
    if (!group) {
        group = 'Resources';
    }
    if (!this.getPBXGroupByKey(group)) {
        group = this.findPBXGroupKey({ name: group });
    }

    const file = new pbxFile(filePath, opt);

    if (!file || this.hasFile(file.path)) return null;

    file.fileRef = this.generateUuid();
    this.addToPbxGroup(file, group);

    if (!file) return false;

    file.target = opt ? opt.target : undefined;
    file.uuid = this.generateUuid();

    this.addToPbxBuildFileSection(file);
    this.addToPbxSourcesBuildPhase(file);

    file.models = [];
    let currentVersionName;
    const modelFiles = fs.readdirSync(file.path);
    for (const index in modelFiles) {
        const modelFileName = modelFiles[index];
        const modelFilePath = path.join(filePath, modelFileName);

        if (modelFileName === '.xccurrentversion') {
            currentVersionName = plist.readFileSync(modelFilePath)._XCCurrentVersionName;
            continue;
        }

        const modelFile = new pbxFile(modelFilePath);
        modelFile.fileRef = this.generateUuid();

        this.addToPbxFileReferenceSection(modelFile);

        file.models.push(modelFile);

        if (currentVersionName && currentVersionName === modelFileName) {
            file.currentModel = modelFile;
        }
    }

    if (!file.currentModel) {
        file.currentModel = file.models[0];
    }

    this.addToXcVersionGroupSection(file);

    return file;
};

pbxProject.prototype.addTargetAttribute = function (prop, value, target) {
    const attributes = this.getFirstProject().firstProject.attributes;
    if (attributes.TargetAttributes === undefined) {
        attributes.TargetAttributes = {};
    }
    target = target || this.getFirstTarget();
    if (attributes.TargetAttributes[target.uuid] === undefined) {
        attributes.TargetAttributes[target.uuid] = {};
    }
    attributes.TargetAttributes[target.uuid][prop] = value;
};

pbxProject.prototype.removeTargetAttribute = function (prop, target) {
    const attributes = this.getFirstProject().firstProject.attributes;
    target = target || this.getFirstTarget();
    if (attributes.TargetAttributes &&
        attributes.TargetAttributes[target.uuid]) {
        delete attributes.TargetAttributes[target.uuid][prop];
    }
};

module.exports = pbxProject;

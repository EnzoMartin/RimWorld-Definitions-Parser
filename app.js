'use strict';

// TODO: General clean up into separate files and add tests, this is just a quick and dirty solution to test it out

const processTime = process.hrtime();
const path = require('path');
const fs = require('fs');
const bunyan = require('bunyan');
const rimraf = require('rimraf');
const pjson = require('./package.json');

const XML = require('./lib/parser');

const level = pjson.logLevel || 30;
const encoding = 'utf8';
const projectRoot = process.cwd();
const distDirectory = path.join(projectRoot,'dist');

const logger = bunyan({
    name:pjson.name,
    level
});

/**
 * Display progress indicator
 * @param {String} message
 * @param {Number} percent
 */
function inform(message,percent){
    logger.info(`${message}.. ${percent.toFixed(2)}%`);
}

/**
 * Save the index files in each folder and base folder to use require with
 * @param {Object} indexes
 * @param {Number} totalFiles
 */
function saveIndexes(indexes,totalFiles){
    logger.info('Writing index files');
    var percent = 0;
    const dirNames = Object.keys(indexes);
    const total = dirNames.length + 1;
    const increment = 100 / total;

    const promises = dirNames.map((directory) =>{
        const promise = new Promise((resolve,reject) =>{
            const savePath = path.join(distDirectory,directory,'index.js');

            const modules = indexes[directory].map((module) =>{
                const name = module.replace('.js','');
                return `${name}:require('./${name}')`;
            });

            const moduleExports = `module.exports={${modules.join(',')}};`;

            fs.writeFile(savePath,moduleExports,{encoding},(err) =>{
                if(err){
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        promise.then(() =>{
            percent += increment;
            inform('Saving indexes',percent);
        });

        return promise;
    });

    const mainIndex = new Promise((resolve,reject) =>{
        const savePath = path.join(distDirectory,'index.js');

        const modules = dirNames.map((name) =>{
            return `${name}:require('./${name}')`;
        });

        const moduleExports = `module.exports={${modules.join(',')}};`;

        fs.writeFile(savePath,moduleExports,{encoding},(err) =>{
            if(err){
                reject(err);
            } else {
                resolve();
            }
        });
    });

    mainIndex.then(() =>{
        percent += increment;
        inform('Saving indexes',percent);
    });

    promises.push(mainIndex);

    Promise.all(promises).then(() =>{
        const elapsed = process.hrtime(processTime);
        logger.info(`Finished processing ${totalFiles} files across ${total} directories, took ${(elapsed[0] * 1000 + elapsed[1] / 1000000)}ms`);
    },(err) =>{
        throw err;
    });
}

/**
 * Save the JS modules for each XML file converted
 * @param {Object} definitions
 * @param {Object} indexes
 */
function saveDefinitions(definitions,indexes){
    logger.info('Writing JS modules');
    var percent = 0;
    const total = definitions.length;
    const increment = 100 / total;

    const promises = definitions.map((definition) =>{
        const promise = new Promise((resolve,reject) =>{
            const savePath = path.join(distDirectory,definition.dirName,definition.moduleName);
            fs.writeFile(savePath,'module.exports=' + JSON.stringify(definition.xml),{encoding},(err) =>{
                if(err){
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        promise.then(() =>{
            percent += increment;
            inform('Saving files',percent);
        });

        return promise;
    });

    Promise.all(promises).then(() =>{
        logger.info('Finished writing modules');
        saveIndexes(indexes,total);
    },(err) =>{
        throw err;
    });
}

/**
 * Create the directories for each definition group
 * @param {Object} definitions
 */
function createDirectories(definitions){
    logger.info('Creating directories to save JS modules into');
    const names = definitions.reduce((names,definition) =>{
        names.dirs[definition.dirName] = true;

        // Build the module names to include in each index.js for a directory
        names.indexes[definition.dirName] = names.indexes[definition.dirName] || [];
        names.indexes[definition.dirName].push(definition.moduleName);

        return names;
    },{
        dirs:{},
        indexes:{}
    });

    const directoryNames = Object.keys(names.dirs);

    var percent = 0;
    const total = directoryNames.length;
    const increment = 100 / total;

    const promises = directoryNames.map((name) =>{
        const promise = new Promise((resolve,reject) =>{
            const directoryPath = path.join(distDirectory,name);
            fs.mkdir(directoryPath,(err) =>{
                if(err){
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        promise.then(() =>{
            percent += increment;
            inform('Creating directories',percent);
        });

        return promise;
    });

    Promise.all(promises).then(() =>{
        logger.info(`Finished creating ${total} directories`);
        saveDefinitions(definitions,names.indexes);
    },(err) =>{
        throw err;
    });
}

/**
 * Wipe out any previous data in `dist`
 * @param {Object} definitions
 */
function wipeDirectories(definitions){
    logger.info('Wiping `dist` directory');
    rimraf(distDirectory,(err) =>{
        if(err){
            throw err;
        } else {
            logger.info('Creating `dist` directory');
            fs.mkdir(distDirectory,() =>{
                createDirectories(definitions);
            });
        }
    });
}

/**
 * Read and parse each XML file to JS
 * @param {Object} definitions
 */
function loadDefinitions(definitions){
    logger.info('Processing definitions from XML to JS');
    var percent = 0;
    const total = definitions.length;
    const increment = 100 / total;

    const promises = definitions.map((definition) =>{
        const promise = new Promise((resolve,reject) =>{
            fs.readFile(definition.path,{encoding},(err,contents) =>{
                if(err){
                    reject(err);
                } else {
                    XML.parse(contents,(err,xml) =>{
                        if(err){
                            reject(err);
                        } else {
                            resolve({
                                dirName: definition.dirName,
                                moduleName: definition.moduleName,
                                name: definition.name,
                                xml
                            });
                        }
                    });
                }
            });
        });

        promise.then(() =>{
            percent += increment;
            inform('Processing',percent);
        });

        return promise;
    });

    Promise.all(promises).then((values) =>{
        logger.info('Processing definitions to JS done');
        wipeDirectories(values);
    },(err) =>{
        throw err;
    });
}

/**
 * Read the Mods\Core directory contents
 * @param {String} definitionsPath
 */
function readDirectory(definitionsPath){
    logger.info('Reading all definitions files and folders');
    fs.readdir(definitionsPath,{encoding},(err,files) =>{
        if(err){
            throw err;
        } else {
            const promises = files.map((name) =>{
                const filePath = path.join(definitionsPath,name);
                return new Promise((resolve,reject) =>{
                    fs.stat(filePath,(err,stats) =>{
                        if(err){
                            reject(err);
                        } else {
                            const isDirectory = stats.isDirectory();
                            if(isDirectory){
                                // Some directories are empty in the current game version
                                fs.readdir(filePath,{encoding},(err,files) =>{
                                    if(err){
                                        reject(err);
                                    } else {
                                        resolve({
                                            isDirectory,
                                            files,
                                            isEmpty: files.length === 0,
                                            name
                                        });
                                    }
                                });
                            } else {
                                resolve({
                                    isDirectory,
                                    name
                                });
                            }
                        }
                    });
                });
            });

            Promise.all(promises).then((values) =>{
                logger.info('Verifying all found definitions contain data');
                const definitions = values.reduce((files,dir) =>{
                    if(dir.isDirectory && !dir.isEmpty){
                        const dirPath = path.join(definitionsPath,dir.name);
                        dir.files.forEach((name) =>{
                            if(name.indexOf('.xml') !== -1){
                                files.push({
                                    dirName: dir.name,
                                    moduleName: name.replace('.xml','.js'),
                                    name,
                                    path:path.join(dirPath,name)
                                });
                            }
                        });
                    }
                    return files;
                },[]);

                logger.info('Finished creating list of files to read from');
                loadDefinitions(definitions);
            },(err) =>{
                throw err;
            });
        }
    });
}

/**
 * Parse the given path
 * @param {String} installPath
 */
function start(installPath){
    if(path.isAbsolute(installPath)){
        const definitionsPath = path.join(installPath,'\\Mods\\Core\\Defs');
        logger.info(`Verifying "${installPath}"`);
        fs.access(definitionsPath,fs.constants.R_OK,(err) =>{
            if(err){
                throw new Error('Provided path is not read accessible or `\\Mods\\Core\\Defs` not found');
            } else {
                readDirectory(definitionsPath);
            }
        });
    } else {
        throw new Error('Need to provide an absolute path');
    }
}

module.exports = start;

// If used from CLI
if(process.argv.length > 2){
    start(process.argv[2]);
}

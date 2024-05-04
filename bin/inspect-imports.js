const ts = require('typescript');
const path = require('path');
const fs = require('fs');
const {createMatchPath, register, loadConfig} = require('tsconfig-paths')


function resolve(moduleName, relativeToFilePath) {
    try {
        // Resolve the module path relative to the given file path
        const resolvedPath = require.resolve(moduleName, {
            paths: [path.resolve(path.dirname(relativeToFilePath))],
        });
        return resolvedPath;
    } catch (error) {
        return null; // Module not found
    }
}


function resolveAliasPath(path, paths = {}) {
    // Sort the keys by length in descending order, so we match the most specific paths first
    const sortedKeys = Object.keys(paths).sort((a, b) => b.length - a.length)

    for (const key of sortedKeys) {
        // Create a regular expression from the key, replacing '*' with a capture group '(.*?)'
        const regex = new RegExp('^' + key.replace(/\*/g, '(.*?)') + '$')

        const match = path.match(regex)
        if (match) {
            // Get the replacement path from the paths object
            let replacementPath = paths[key][0]

            // If the replacement path contains a wildcard, replace it with the captured group from the original path
            if (replacementPath.includes('*')) {
                replacementPath = replacementPath.replace('*', match[1])
            }

            // Replace the matched part of the original path with the replacement path
            return path.replace(regex, replacementPath).trim()
        }
    }

    // If no matching key was found, return the original path
    return path
}

function getImportedModules(filePath, program) {
    const sourceFile = program.getSourceFile(filePath);
    const importedModules = [];

    function visit(node) {
        if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
            const moduleName = node.moduleSpecifier.text;
            importedModules.push(moduleName);
        }
        ts.forEachChild(node, visit);
    }

    if (sourceFile) {
        visit(sourceFile);
    }

    return importedModules;
}


function getRecursiveImportedModules(filePath, program, modules = []) {
    const importedModules = getImportedModules(filePath, program);

    importedModules.forEach(moduleName => {
        const modulePath = resolveModulePath(moduleName, filePath);
        if (modulePath && !modules.includes(modulePath)) {
            console.log(`${moduleName}:`, modulePath)
            modules.push(modulePath);
            if (modulePath.includes(process.cwd())) {
                const {configFileAbsolutePath} = loadConfig(path.dirname(modulePath))
                let tsConfig;
                let compilerOptions = {}
                if (configFileAbsolutePath) {
                    tsConfig = require(configFileAbsolutePath)
                }
                if (tsConfig) {
                    compilerOptions = ts.convertCompilerOptionsFromJson(tsConfig.compilerOptions, process.cwd()).options;
                }
                const moduleProgram = ts.createProgram([modulePath], compilerOptions);
                getRecursiveImportedModules(modulePath, moduleProgram, modules)
            }
        }
    });
    return modules
}

function listAllImportedModules(filePath) {
    const {paths, absoluteBaseUrl, configFileAbsolutePath} = loadConfig(path.dirname(filePath))
    register({
        baseUrl: absoluteBaseUrl,
        paths,
    })
    const tsConfig = require(configFileAbsolutePath)
    const compilerOptions = ts.convertCompilerOptionsFromJson(tsConfig.compilerOptions, process.cwd()).options;
    const program = ts.createProgram([filePath], compilerOptions);
    const allImportedModules = getRecursiveImportedModules(filePath, program);

    const uniqueImportedModules = Array.from(new Set(allImportedModules));
    console.log(" ");
    console.log("Imported modules:");
    uniqueImportedModules
        .sort((a, b) => a.localeCompare(b))
        .forEach(moduleName => console.log(moduleName));
}

function resolveModulePath(moduleName, filePath) {
    const {paths} = loadConfig(path.dirname(filePath))
    const modulePath = resolveAliasPath(moduleName, paths);

    const extensions = ['', '.js', '.jsx', '.ts', '.tsx', '/index.js', '/index.ts', '/package.json'];

    for (const ext of extensions) {
        const resolvedPath = resolve(modulePath + ext, filePath);
        if (resolvedPath) {
            if (resolvedPath.includes('node_modules')) return moduleName
            return resolvedPath;
        }
    }
}

// Extract command line arguments
const args = process.argv.slice(2);
if (args.length !== 1) {
    console.error('Usage: node script.js <file-path>');
    process.exit(1);
}

const filePath = args[0];
const tsConfigPath = args[1];
listAllImportedModules(filePath, tsConfigPath);

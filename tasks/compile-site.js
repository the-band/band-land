#!/usr/bin/env node

 /* eslint-env es6 */

'use strict';

// get Promises going
require('any-promise/register/bluebird');
var Promise = require('bluebird');
var path = require('path');
var pkg = require(path.resolve(process.cwd(),'package.json'));

var metalsmith = require('metalsmith');
var css = require('metalsmith-clean-css');
var define = require('metalsmith-define');
var layouts = require('metalsmith-layouts');
var collections = require('metalsmith-collections');
var fingerprint = require('metalsmith-fingerprint');
var date = require('metalsmith-build-date');
// var drafts = require('metalsmith-drafts');
// var markdown = require('metalsmith-markdown');
// var permalinks = require('metalsmith-permalinks');
// var branch = require('metalsmith-branch');
// var fsx = require('fs-promise');


var minimistOptions = {
  boolean:['saveTemp','cleanOutput', 'dryRun', 'verbose'],
  string:'outputDir',
  alias: {
    c:'cleanOutput',
    o:'outputDir',
    n:'dryRun',
    v:'verbose'
  },
  default: {
    cleanOutput: true,
    outputDir:'dist',
    dryRun: false,
    verbose: false
  }
};

var args = require('minimist')(process.argv.slice(2), minimistOptions);
// var tempFolder = path.resolve(process.cwd(), '.tmp');
// var tempSource = path.resolve(tempFolder, 'source');
// var tempTemplates = path.resolve(tempFolder, 'templates');
var siteDefinitions = pkg.siteDetails;
siteDefinitions.moment = require('moment');

prepareForCompile()
.then(compileSite)
.then(compileComplete)
.catch(function (error) {
  console.log('zomg error');
  console.log(error);
  process.exit(-1);
});

function prepareForCompile() {
  console.log('Ready!');
  return Promise.resolve(true);
}

function compileSite() {
  if (args.verbose) logMetalsmithOpts(process.cwd());
  if (args.dryRun) {
    console.log('Not running metalsmith. Because dry run.');
    return Promise.reject(process.exit(0));
  }
  console.log('Compiling to .tmp/', args.outputDir);
  console.log('Starting Metalsmith ...');

  return new Promise(function(resolve, reject) {
    metalsmith(process.cwd())
    .clean(args.cleanOutput)
    .source('site')
    .ignore('.gitkeep')
    .use(define(siteDefinitions))
    .use(collections(getCollectionsOpts()))
    // .use(branch()
    //   .pattern('articles/**/*.*')
    //   .use(drafts())
    //   .use(markdown(getMarkdownOpts()))
    //   .use(permalinks()))
    // .use(branch()
    //   .pattern('faq/*.*')
    //   .use(markdown(getMarkdownOpts())))
    .use(css(getCSSOpts()))
    .use(date())
    .use(fingerprint(getFingerprintOpts()))
    .use(layouts(getLayoutOpts()))
    .destination(args.outputDir)
    .build(function(error) {
      if (error) {
        console.log('Error running Metalsmith!');
        reject(error);
      } else {
        resolve();
      }
    });
  });
}


function getCollectionsOpts() {
  return {
    articles: {
      pattern: 'articles/**/*.md',
      sortBy: 'date',
      reverse: true
    },
    faq: {
      pattern: 'faq/*.md',
      sortBy: 'itemId',
      reverse: false
    }
  };
}

function getMarkdownOpts() {
  return {
    gfm: true,
    tables: true,
    highlight: require('highlighter')()
  };
}

function getCSSOpts() {
  return {
    files: 'css/**/*.css',
    cleanCSS: {
      rebase: true
    }
  };
}

function getFingerprintOpts() {
  var defaultOpts = {
    pattern: '{css,js}/**/*'
  };
  return getPkgValueOrDefault('fingerprint', defaultOpts);
}

function getLayoutOpts() {
  var defaultOpts = {
    engine: 'pug',
    directory: 'templates',
    pretty: true
  };
  return getPkgValueOrDefault('layouts', defaultOpts);
}

function getPkgValueOrDefault(key, defaultOpts) {
  if (pkg.metalsmith && pkg.metalsmith[key]) {
    return JSON.parse(JSON.stringify(pkg.metalsmith[key]));
  } else {
    return defaultOpts;
  }
}

function compileComplete() {
  console.log('Compile site completed!');
  console.log('You may deploy if ready');
}

function logMetalsmithOpts(rootFolder) {
  console.log('Metalsmith options are:');
  console.log(`metalsmith(${rootFolder})`);
  console.log(`  .clean(${args.cleanOutput})`);
  console.log('  .source(\'source\')');
  console.log('  .ignore(.gitkeep)');
  console.log('  .use(define(...');
  console.log('    opts  => ', siteDefinitions);
  console.log('  .use(collections(... ');
  console.log(getCollectionsOpts());
  console.log('  .use(markdown(... ');
  console.log(getMarkdownOpts());
  console.log('  .use(date())');
  console.log('  .use(drafts())');
  console.log('  .use(permalinks())');
  console.log('  .use(css(...');
  console.log(getCSSOpts());
  console.log('  .use(fingerprint(...');
  console.log(getFingerprintOpts());
  console.log('  .use(layouts(...');
  console.log(getLayoutOpts());
  console.log(`  .destination(${args.outputDir})`);
  console.log('  .build(function build...)');
}

/*eslint-env node*/
'use strict';

// Gulp plugins
var gulp = require('gulp'),
    connect = require('gulp-connect'),
    sourcemaps = require('gulp-sourcemaps'),
    to5 = require('gulp-6to5'),
    less = require('gulp-less'),
    minifyCss = require('gulp-minify-css'),
    clean = require('gulp-clean'),
    eslint = require('gulp-eslint'),

    fs = require('fs-extra'),
    runSequence = require('run-sequence'),
    path = require('path');

// Path definition
var buildPath = path.resolve('./build'),
    sourcePath = 'app';

/**
 * Livereload server on buildPath
 */
gulp.task('connect', function () {
    connect.server({
        livereload: true,
        root: buildPath,
        port: 8080
    });
});

/**
 * File watch and trigger build of:
 * 		* HTML
 * 		* JavaScript
 * 		* LESS
 */
gulp.task('watch', function () {
    gulp.watch([sourcePath + '/**/*.html'], ['html']);
    gulp.watch([sourcePath + '/**/*.js'], ['scripts', 'lint']);
    gulp.watch([sourcePath + '/**/*.less'], ['styles']);
});

/**
 * Purify buildPath and create build folder
 */
gulp.task('clean', function () {
    return gulp.src(buildPath, {read: false})
        .pipe(clean())
        .on('end', function () {
            fs.mkdirsSync(buildPath);
        });
});

/**
 * Clean all HTML files in buildPath
 */
gulp.task('clean-html', function () {
    return gulp.src(buildPath + '/**/*.html')
        .pipe(clean());
});

/**
 * HTML build task:
 * 		* Copies HTML files to buildPath
 */
gulp.task('html', ['clean-html'], function () {
    return gulp.src(sourcePath + '/**/*.html')
        .pipe(gulp.dest(buildPath))
        .pipe(connect.reload());
});

/**
 * Clean all JavaScript files in buildPath
 */
gulp.task('clean-scripts', function () {
    return gulp.src(buildPath + '/**/*.js')
        .pipe(clean());
});

/**
 * JavaScript build task:
 * 		* Converts ecmascript 6 to 5
 * 		* Creates sourcemaps
 * 		* Copies compiled files to buildPath
 */
gulp.task('scripts', ['clean-scripts'], function () {
    return gulp.src(sourcePath + '/**/*.js')
        .pipe(sourcemaps.init())
        .pipe(to5())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(buildPath))
        .pipe(connect.reload());
});

/**
 * Clean all Less files in buildPath
 */
gulp.task('clean-styles', function () {
    return gulp.src(buildPath + '/**/*.less')
        .pipe(clean());
});

/**
 * LESS build task:
 * 		* Converts LESS to CSS
 * 		* Minifies CSS
 * 		* Copies compiled files to buildPath
 */
gulp.task('styles', ['clean-styles'], function () {
    return gulp.src(sourcePath + '/**/*.less')
        .pipe(less())
        .pipe(minifyCss())
        .pipe(gulp.dest(buildPath))
        .pipe(connect.reload());
});

/**
 * Vendor build task:
 * 		* Copies vendor files to buildPath
 */
gulp.task('vendor', function () {
    // var vendorPath = path.resolve(buildPath, 'vendor');
    // gulp.src('./node_modules/gulp/**/*.js')
    //     .pipe(gulp.dest(vendorPath));
});

/**
 * Linting task
 */
gulp.task('lint', function () {
    return gulp.src([sourcePath + '/**/*.js'])
        .pipe(eslint())
        .pipe(eslint.format());
});

/**
 * Build task including:
 * 		* clean
 * 		* vendor
 * 		* html
 * 		* scripts
 * 		* styles
 */
gulp.task('build', function (cb) {
    runSequence('clean', ['vendor', 'html', 'lint', 'scripts', 'styles'], cb);
});

/**
 * Default task including:
 * 		* build
 * 		* connect
 * 		* watch
 */
gulp.task('default', ['build', 'connect', 'watch']);

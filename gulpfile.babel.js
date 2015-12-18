/*eslint-env node es6*/

//
// Imports
import fs from 'fs-extra';
import runSequence from 'run-sequence';
import path from 'path';
import gulp from 'gulp';

// Gulp plugins
import connect from 'gulp-connect';
import sourcemaps from 'gulp-sourcemaps';
import babel from 'gulp-babel';
import less from 'gulp-less';
import minifyCss from 'gulp-minify-css';
import clean from 'gulp-clean';
import eslint from 'gulp-eslint';

// Path definition
const buildPath = path.resolve('./build');
const sourcePath = 'source';

/**
 * Livereload server on buildPath
 */
gulp.task('connect', () => {
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
gulp.task('watch', () => {
    gulp.watch([sourcePath + '/**/*.html'], ['html']);
    gulp.watch([sourcePath + '/**/*.js'], ['scripts', 'lint']);
    gulp.watch([sourcePath + '/**/*.less'], ['styles']);
});

/**
 * Purify buildPath and create build folder
 */
gulp.task('clean', () => {
    return gulp.src(buildPath, {read: false})
        .pipe(clean())
        .on('end', function () {
            fs.mkdirsSync(buildPath);
        });
});

/**
 * Clean all HTML files in buildPath
 */
gulp.task('clean-html', () => {
    return gulp.src(buildPath + '/**/*.html')
        .pipe(clean());
});

/**
 * HTML build task:
 * 		* Copies HTML files to buildPath
 */
gulp.task('html', ['clean-html'], () => {
    return gulp.src(sourcePath + '/**/*.html')
        .pipe(gulp.dest(buildPath))
        .pipe(connect.reload());
});

/**
 * Clean all JavaScript files in buildPath
 */
gulp.task('clean-scripts', () => {
    return gulp.src(buildPath + '/**/*.js')
        .pipe(clean());
});

/**
 * JavaScript build task:
 * 		* Converts ecmascript 6 to 5
 * 		* Creates sourcemaps
 * 		* Copies compiled files to buildPath
 */
gulp.task('scripts', ['clean-scripts'], () => {
    return gulp.src(sourcePath + '/**/*.js')
        .pipe(sourcemaps.init())
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(buildPath))
        .pipe(connect.reload());
});

/**
 * Clean all Less files in buildPath
 */
gulp.task('clean-styles', () => {
    return gulp.src(buildPath + '/**/*.less')
        .pipe(clean());
});

/**
 * LESS build task:
 * 		* Converts LESS to CSS
 * 		* Minifies CSS
 * 		* Copies compiled files to buildPath
 */
gulp.task('styles', ['clean-styles'], () => {
    return gulp.src(sourcePath + '/**/main.less')
        .pipe(less())
        .pipe(minifyCss())
        .pipe(gulp.dest(buildPath))
        .pipe(connect.reload());
});

/**
 * Linting task
 */
gulp.task('lint', () => {
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
gulp.task('build', (cb) => {
    runSequence('clean', ['html', 'lint', 'scripts', 'styles'], cb);
});

/**
 * Default task including:
 * 		* build
 * 		* connect
 * 		* watch
 */
gulp.task('default', ['build', 'connect', 'watch']);

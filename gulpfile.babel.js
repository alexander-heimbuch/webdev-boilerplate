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
import uglify from 'gulp-uglify';
import concat from 'gulp-concat';
import rename from 'gulp-rename';

// Path and file definition
const dir = {
    build: path.resolve('./build'),
    source: 'source'
};

const file = {
    scripts: 'script.min.js',
    styles: 'style.min.css'
}

/**
 * Livereload server on dir.build
 */
gulp.task('connect', () => {
    connect.server({
        livereload: true,
        root: dir.build,
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
    gulp.watch([dir.source + '/**/*.html'], ['html']);
    gulp.watch([dir.source + '/**/*.js'], ['scripts', 'lint']);
    gulp.watch([dir.source + '/**/*.less'], ['styles']);
});

/**
 * Purify dir.build and create build folder
 */
gulp.task('clean', () => {
    return gulp.src(dir.build, {read: false})
        .pipe(clean())
        .on('end', function () {
            fs.mkdirsSync(dir.build);
        });
});

/**
 * Clean all HTML files in dir.build
 */
gulp.task('clean-html', () => {
    return gulp.src(dir.build + '/**/*.html')
        .pipe(clean());
});

/**
 * HTML build task:
 * 		* Copies HTML files to dir.build
 */
gulp.task('html', ['clean-html'], () => {
    return gulp.src(dir.source + '/**/*.html')
        .pipe(gulp.dest(dir.build))
        .pipe(connect.reload());
});

/**
 * Clean all JavaScript files in dir.build
 */
gulp.task('clean-scripts', () => {
    return gulp.src(dir.build + '/**/*.js')
        .pipe(clean());
});

/**
 * JavaScript build task:
 * 		* Converts ecmascript 6 to 5
 * 		* Creates sourcemaps
 * 		* Copies compiled files to dir.build
 */
gulp.task('scripts', ['clean-scripts'], () => {
    return gulp.src(dir.source + '/**/*.js')
        .pipe(sourcemaps.init())
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(uglify())
        .pipe(sourcemaps.write('.'))
        .pipe(concat(file.scripts))
        .pipe(gulp.dest(dir.build))
        .pipe(connect.reload());
});

/**
 * Clean all Less files in dir.build
 */
gulp.task('clean-styles', () => {
    return gulp.src(dir.build + '/**/*.less')
        .pipe(clean());
});

/**
 * LESS build task:
 * 		* Converts LESS to CSS
 * 		* Minifies CSS
 * 		* Copies compiled files to dir.build
 */
gulp.task('styles', ['clean-styles'], () => {
    return gulp.src(dir.source + '/**/main.less')
        .pipe(less())
        .pipe(minifyCss())
        .pipe(rename(file.styles))
        .pipe(gulp.dest(dir.build))
        .pipe(connect.reload());
});

/**
 * Linting task
 */
gulp.task('lint', () => {
    return gulp.src([dir.source + '/**/*.js'])
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

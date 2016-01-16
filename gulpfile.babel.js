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
import run from 'run-sequence';
import watch from 'gulp-watch';
import plumber from 'gulp-plumber';
import util from 'gulp-util';
import prefixer from 'gulp-autoprefixer';
import exec from 'gulp-exec';

// Path and file definition
const project = __dirname.split(path.sep).pop();

const dir = {
    build: path.resolve('./build'),
    source: 'source'
};

const file = {
    scripts: 'script.min.js',
    styles: 'style.min.css'
}

const scripts = [
    dir.source + '/**/*.js'
];

// Deployment settings
const deploy = {
    server: 'admin@preview',
    port: 8080
};

/**
 * Deploy and build site
 */
gulp.task('deploy', ['build'], () => {
    return gulp.src(dir.build)
        .pipe(exec(`ssh ${deploy.server} rm -rf ${project}`))
        .pipe(exec(`ssh ${deploy.server} mkdir -p ${project}`))
        .pipe(exec(`scp -rp ${dir.build} ${deploy.server}:${project}/build/`))
        .pipe(exec(`scp Dockerfile ${deploy.server}:${project}/Dockerfile`))
        .pipe(exec(`scp build.sh ${deploy.server}:${project}/build.sh`))
        .pipe(exec(`ssh ${deploy.server} "cd ${project} && sh build.sh ${project} ${deploy.port}"`))
        .pipe(exec.reporter());
});


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
 *      * HTML
 *      * JavaScript
 *      * LESS
 */
gulp.task('watch', () => {
    watch([dir.source + '/**/*.html'], () => run('html'));
    watch([dir.source + '/**/*.js'], () => run(['scripts', 'lint']));
    watch([dir.source + '/**/*.less'], () => run('styles'));
    watch([dir.source + '/**/*.{jpg,png,svg}'], () => run('statics'));
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
 *      * Copies HTML files to dir.build
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
 *      * Converts ecmascript 6 to 5
 *      * Creates sourcemaps
 *      * Copies compiled files to dir.build
 */
gulp.task('scripts', ['clean-scripts'], (done) => {
    return gulp.src(scripts)
        .pipe(plumber({
            errorHandler: (err) =>  {
                util.log(util.colors.red(err));
                done();
            }
        }))
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(uglify())
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
 *      * Converts LESS to CSS
 *      * Minifies CSS
 *      * Copies compiled files to dir.build
 */
gulp.task('styles', ['clean-styles'], (done) => {
    return gulp.src(dir.source + '/**/main.less')
        .pipe(plumber({
            errorHandler: (err) =>  {
                util.log(util.colors.red(err));
                done();
            }
        }))
        .pipe(less())
        .pipe(prefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(minifyCss())
        .pipe(rename(file.styles))
        .pipe(gulp.dest(dir.build))
        .pipe(connect.reload());
});

/**
 * Clean all static files in dir.build
 */
gulp.task('clean-statics', () => {
    return gulp.src(dir.build + '/**/*.{jpg,png,svg}')
        .pipe(clean());
});

/**
 * Static build task:
 *      * Copy static files to build path
 */
gulp.task('statics', ['clean-statics'], () => {
    return gulp.src(dir.source + '/**/*.{jpg,png,svg}')
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
 *      * clean
 *      * vendor
 *      * html
 *      * scripts
 *      * styles
 */
gulp.task('build', (cb) => {
    runSequence('clean', ['html', 'scripts', 'styles', 'statics'], cb);
});

/**
 * Default task including:
 *      * build
 *      * connect
 *      * watch
 */
gulp.task('default', ['build', 'connect', 'watch']);

var gulp = require('gulp');
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');
var inject = require('gulp-inject');
var bower = require('main-bower-files')
var gulpFilter = require('gulp-filter')
var rename = require('gulp-rename')
var less = require('gulp-less');
var gls = require('gulp-live-server');
var usemin = require('gulp-usemin');
var jade = require('gulp-jade');
var uglify = require('gulp-uglify');
var minifyHtml = require('gulp-minify-html');
var minifyCss = require('gulp-clean-css');
var ngAnnotate = require('gulp-ng-annotate')
var rev = require('gulp-rev');

var runSequence = require('run-sequence');

var del = require('del');

var server = gls.new('server/bootstrap.js');

var paths = {
  scripts: ['./client/{app,components}/**/!(*.spec|*.mock).js'],
  styles: ['./client/{app,components}/**/*.less', '!./client/app/main/app.less'],
  copy: ['./client/index.html', './client/assets/**/*', './client/bower_components/**/fonts/*'],
  watchClient: ['./client/**/*'],
  watchServer: ['./server/**/*']
}

// Not all tasks need to use streams
// A gulpfile is just another node program and you can use any package available on npm
gulp.task('clean', function() {
  // You can use multiple globbing patterns as you would with `gulp.src`
  return del(['build']);
});

gulp.task('usemin', function() {
  return gulp.src('./client/index.html')
    .pipe(usemin({
      less: [less({
        paths: ['./client/']
      })],
      js: [  ]
    }))
    .pipe(gulp.dest('./build/'));
});

gulp.task('usemin:dist', function() {
  return gulp.src('./client/index.html')
    .pipe(usemin({
      less: [less({
        paths: ['./client/']
      })],
      js: [  ]
    }))
    .pipe(gulp.dest('./build/'));
});

gulp.task('copy', function() {
  return gulp.src(paths.copy, {base: "client/"})
    .pipe(gulp.dest('./build'))
})

gulp.task('serve', function() {
  return server.start();
})

// Rerun the task when a file changes
gulp.task('watch', function() {
  gulp.watch(paths.watchClient, ['usemin', 'copy', 'jade'])
    .on('change', function(event) {
      setTimeout(function() {
        server.notify(event)
      }, 1400);
    });
  gulp.watch(paths.watchServer, function() {
    server.start.bind(server)()
  });
});

gulp.task('jade', function() {
  var jadeFilter = gulpFilter('**/*.jade', {restore: true});
  return gulp.src(['./client/**/*.jade', '!./client/index.html'], {base: './client'})
    .pipe(jadeFilter)
    .pipe(jade())
    .pipe(jadeFilter.restore)
    .pipe(gulp.dest('./build'))
});

// The default task (called when you run `gulp` from cli)
gulp.task('develop', function(callback) {
  runSequence('clean', ['usemin', 'copy', 'watch', 'jade'], 'serve', callback)
});

gulp.task('dist', function(callback) {
  runSequence('clean', ['usemin:dist', 'copy', 'jade'], callback);
});

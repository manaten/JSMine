gulp = require 'gulp'

gulp.task 'copy:assets', ->
  gulp.src 'src/assets/**/*'
  .pipe gulp.dest 'build/assets'

through2 = require 'through2'
browserify = require 'browserify'
babelify = require 'babelify'
gulp.task 'build:js', ->
  # https://gist.github.com/Problematic/c95444472e6d3c5f8460
  gulp
  .src './src/js/app.js'
  .pipe through2.obj (file, enc, next) ->
    browserify file.path
    .transform babelify
    .bundle (err, res) ->
      return next err if err
      file.contents = res;
      next null, file
  .on 'error', (err) ->
    console.log err.stack
    this.emit 'end'
  .pipe gulp.dest 'build/js'

jade = require 'gulp-jade'
gulp.task 'build:html', ->
  gulp.src 'src/*.jade'
  .pipe jade()
  .pipe gulp.dest 'build'

webserver = require 'gulp-webserver'
gulp.task 'webserver', ->
  gulp.src 'build'
  .pipe webserver
    directoryListing: false
    open: false
    host: '0.0.0.0'
    port: 8080
    fallback: 'index.html'

gulp.task 'watch', ->
  gulp.watch ['src/**/*.js'], ['build:js']
  gulp.watch ['src/assets/**/*'], ['copy:assets']
  gulp.watch ['src/**/*.jade'], ['build:html']

gulp.task 'build', ['build:js', 'build:html', 'copy:assets']
gulp.task 'start', ['build', 'webserver']
gulp.task 'debug', ['build', 'watch', 'webserver']

gulp = require 'gulp'


replace = require 'gulp-replace-async'
datauri = require 'datauri'
gulp.task 'inline:json', ->
  gulp
  .src './src/assets/**/*.json'
  .pipe replace /\.\/mine\.gif/g, (match, done) ->
    datauri './src/assets/mine.gif', done
  .on 'error', (err) ->
    console.log err.message
    this.emit 'end'
  .pipe gulp.dest 'tmp/assets'

through2 = require 'through2'
browserify = require 'browserify'
babelify = require 'babelify'
gulp.task 'build:js', ['inline:json'], ->
  gulp
  .src './src/js/app.js'
  .pipe through2.obj (file, enc, next) ->
    browserify file.path, {debug: true}
    .transform babelify
    .bundle (err, res) ->
      return next err if err
      file.contents = res
      next null, file
  .on 'error', (err) ->
    console.log err.message
    console.log err.codeFrame if err.codeFrame
    this.emit 'end'
  .pipe replace /\.\/assets\/mine\.json/g, (match, done) ->
    datauri './tmp/assets/mine.json', done
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
  gulp.watch ['src/**/*.js', 'src/assets/**/*'], ['build:js']
  gulp.watch ['src/**/*.jade'], ['build:html']

gulp.task 'build', ['build:js', 'build:html']
gulp.task 'start', ['build', 'webserver']
gulp.task 'debug', ['build', 'watch', 'webserver']
